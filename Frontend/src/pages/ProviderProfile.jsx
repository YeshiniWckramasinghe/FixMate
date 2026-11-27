import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import ProviderLayout from '../components/ProviderLayout';
import { initials } from '../utils/format';
import '../provider.css';

// The category most of the provider's services belong to, e.g. "Electrician"
function mainCategory(services) {
  const counts = {};
  services.forEach((s) => {
    if (s.category) counts[s.category] = (counts[s.category] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '';
}

export default function ProviderProfile() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [loading, setLoading] = useState(true);

  // Only used for the rating and the counts, so a failure just leaves them empty
  useEffect(() => {
    Promise.all([
      client.get('/api/provider/services').catch(() => ({ data: [] })),
      client.get('/api/bookings/provider').catch(() => ({ data: [] })),
    ])
      .then(([s, b]) => {
        setServices(s.data);
        setCompletedJobs(b.data.filter((x) => x.status === 'COMPLETED').length);
      })
      .finally(() => setLoading(false));
  }, []);

  const { rating, reviews } = useMemo(() => {
    const total = services.reduce((sum, s) => sum + (s.reviewCount || 0), 0);
    const weighted = services.reduce((sum, s) => sum + (s.averageRating || 0) * (s.reviewCount || 0), 0);
    return { rating: total ? weighted / total : null, reviews: total };
  }, [services]);

  const name = user?.name || '';
  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');
  const specialty = mainCategory(services);

  // A provider can only add services once an admin has approved them, so having one
  // is the proof we can show (the app does not receive the approval flag itself).
  const verified = services.length > 0;

  return (
    <ProviderLayout>
      <div className="fm-dash">
        <div className="fm-page-header">
          <div>
            <h1>Professional profile</h1>
            <p>Your FixMate account details and how customers see you.</p>
          </div>
        </div>

        <div className="fm-profile-layout">
          <div className="fm-card fm-profile-card">
            <span className="fm-avatar fm-avatar-xl fm-avatar-blue">
              {initials(name)}
              {verified && (
                <i>
                  <Icon name="check" size={12} />
                </i>
              )}
            </span>
            <h3>{name}</h3>
            <p>{specialty || 'Service provider'}</p>

            {rating !== null ? (
              <>
                <span className="fm-profile-rating">
                  <Icon name="star" size={17} /> {rating.toFixed(1)}
                </span>
                <div className="fm-profile-reviews">
                  {reviews} customer {reviews === 1 ? 'review' : 'reviews'}
                </div>
              </>
            ) : (
              <div className="fm-profile-reviews">{loading ? ' ' : 'No reviews yet'}</div>
            )}

            {!loading &&
              (verified ? (
                <div className="fm-verification-box">
                  <Icon name="shield" />
                  <div>
                    <b>Verified provider</b>
                    <span>Approved by the FixMate team</span>
                  </div>
                </div>
              ) : (
                <div className="fm-verification-box fm-neutral">
                  <Icon name="shield" />
                  <div>
                    <b>Not listed yet</b>
                    <span>Add a service so customers can find you</span>
                  </div>
                </div>
              ))}

            <div className="fm-profile-stat">
              <div>
                <b>{loading ? '…' : services.length}</b>
                <span>Services</span>
              </div>
              <div>
                <b>{loading ? '…' : completedJobs}</b>
                <span>Jobs completed</span>
              </div>
            </div>
          </div>

          <div className="fm-card fm-form-card">
            <div className="fm-card-heading">
              <div>
                <h3>Account information</h3>
                <p>These details come from your FixMate account.</p>
              </div>
            </div>

            <div className="fm-form-grid">
              <label>
                First name
                <input value={firstName || ''} readOnly />
              </label>
              <label>
                Last name
                <input value={lastName} readOnly placeholder="—" />
              </label>
              <label className="fm-full">
                Email address
                <input value={user?.email || ''} readOnly />
              </label>
              <label>
                Specialisation
                <input value={specialty || 'Not set yet'} readOnly />
              </label>
              <label>
                Account type
                <input value="Service provider" readOnly />
              </label>
            </div>

            <div className="fm-profile-note">
              <Icon name="settings" size={16} />
              <span>
                Editing profile details (phone number, experience, about me) isn’t available yet.
                Your specialisation is taken from the categories of the services you list.
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}