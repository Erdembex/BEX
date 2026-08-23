package com.takkas.modules.application.repository;

import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findAllByListingIdOrderByAppliedAtDesc(UUID listingId);
    List<Application> findAllByListingIdAndStatus(UUID listingId, ApplicationStatus status);
    List<Application> findAllByIndividualIdOrderByAppliedAtDesc(UUID individualId);
    List<Application> findAllByIndividualIdAndStatusInOrderByReviewedAtDesc(
        UUID individualId, Collection<ApplicationStatus> statuses);

    List<Application> findAllByBusinessIdAndStatusInOrderByAppliedAtDesc(
        UUID businessId, Collection<ApplicationStatus> statuses);
    List<Application> findAllByBusinessIdOrderByAppliedAtDesc(UUID businessId);
    List<Application> findAllByStatusOrderBySubmittedAtDesc(ApplicationStatus status);
    boolean existsByListingIdAndIndividualId(UUID listingId, UUID individualId);
    long countByListingIdAndStatus(UUID listingId, ApplicationStatus status);
    long countByListingId(UUID listingId);

    @Query("""
        SELECT a.listingId, COUNT(a) FROM Application a
        WHERE a.listingId IN :listingIds
          AND a.status NOT IN ('WITHDRAWN', 'REJECTED')
        GROUP BY a.listingId
        """)
    List<Object[]> countActiveApplicantsByListingIds(@Param("listingIds") Collection<UUID> listingIds);

    @Query("""
        SELECT a.listingId, COUNT(a) FROM Application a
        WHERE a.listingId IN :listingIds
          AND a.status IN ('ACCEPTED', 'SUBMITTED', 'SUBMISSION_APPROVED', 'REWARDED')
        GROUP BY a.listingId
        """)
    List<Object[]> countAcceptedApplicantsByListingIds(@Param("listingIds") Collection<UUID> listingIds);

    long countByBusinessIdAndStatusIn(UUID businessId, Collection<ApplicationStatus> statuses);
    long countByIndividualIdAndStatusIn(UUID individualId, Collection<ApplicationStatus> statuses);

    @Query("""
        SELECT COUNT(a) > 0 FROM Application a JOIN a.submissionImageUrls img
        WHERE a.businessId = :businessId
          AND (img = :url OR img LIKE CONCAT('%', :filename))
        """)
    boolean businessCanAccessSubmissionImage(
        @Param("businessId") UUID businessId,
        @Param("url") String url,
        @Param("filename") String filename);

    @Query("""
        SELECT COUNT(a) > 0 FROM Application a JOIN a.submissionImageUrls img
        WHERE a.status IN ('SUBMISSION_APPROVED', 'REWARDED')
          AND (img = :url OR img LIKE CONCAT('%', :filename))
        """)
    boolean isPublicPortfolioImage(@Param("url") String url, @Param("filename") String filename);

    @Query(value = """
        SELECT individual_id, COUNT(*) AS cnt FROM applications
        WHERE status = 'REWARDED'
        GROUP BY individual_id ORDER BY cnt DESC LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopRewardedIndividuals(@Param("limit") int limit);

    @Query(value = """
        SELECT business_id, COUNT(*) AS cnt FROM applications
        WHERE status = 'REWARDED'
        GROUP BY business_id ORDER BY cnt DESC LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopRewardingBusinesses(@Param("limit") int limit);
}
