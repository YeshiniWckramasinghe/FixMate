package com.fixmate.service;

import com.fixmate.exception.BadRequestException;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;

// Turns an uploaded picture into a small JPEG. Decoding and re-encoding it also means we only
// ever store and serve real image data, never whatever the uploaded file happened to contain.
final class ThumbnailEncoder {

    static final int MAX_SIDE = 640;
    private static final long MAX_PIXELS = 25_000_000L;
    private static final float JPEG_QUALITY = 0.85f;

    private ThumbnailEncoder() {
    }

    static byte[] toJpeg(InputStream input) throws IOException {
        try (ImageInputStream stream = ImageIO.createImageInputStream(input)) {
            if (stream == null) {
                throw new BadRequestException(unsupportedMessage());
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) {
                throw new BadRequestException(unsupportedMessage());
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(stream, true, true);

                // Check the size before decoding, so a huge image can't use up the server's memory
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                if (pixels > MAX_PIXELS) {
                    throw new BadRequestException("That image is too large. Please use a smaller one.");
                }

                BufferedImage source = reader.read(0);
                return encode(scaleToFit(source));
            } finally {
                reader.dispose();
            }
        }
    }

    private static String unsupportedMessage() {
        return "That file is not a supported image. Please use a JPG, PNG or GIF.";
    }

    // Shrinks the image to fit inside MAX_SIDE x MAX_SIDE (never enlarges it) and flattens
    // transparency onto white, because JPEG has no alpha channel.
    private static BufferedImage scaleToFit(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        double scale = Math.min(1.0, (double) MAX_SIDE / Math.max(width, height));
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));

        BufferedImage rgb = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = rgb.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, targetWidth, targetHeight);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }
        return rgb;
    }

    private static byte[] encode(BufferedImage image) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        try {
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(JPEG_QUALITY);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            try (ImageOutputStream imageOut = ImageIO.createImageOutputStream(out)) {
                writer.setOutput(imageOut);
                writer.write(null, new IIOImage(image, null, null), param);
            }
            return out.toByteArray();
        } finally {
            writer.dispose();
        }
    }
}
