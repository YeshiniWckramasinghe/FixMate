package com.fixmate.repository;

import com.fixmate.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// Used while a booking is being created: it locks the provider's row in the database, so two
// customers who press "Confirm booking" for the same slot at the same moment are handled one
// after the other, and the second one is told the slot is taken.
public interface ProviderLockRepository extends Repository<User, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findForUpdateById(@Param("id") Long id);
}
