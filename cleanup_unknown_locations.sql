-- ====================================================
-- Cleanup Unknown & Local Locations dari Stats
-- ====================================================

-- 1. Hapus entri Unknown dan Local
DELETE FROM page_views 
WHERE city = 'Unknown' 
   OR city = 'Local'
   OR city IS NULL
   OR country IS NULL;

-- 2. Verifikasi hasil cleanup
SELECT 
    COUNT(*) as total_clean_views,
    COUNT(DISTINCT CONCAT(city, ', ', country)) as unique_locations
FROM page_views
WHERE city IS NOT NULL 
  AND city != 'Unknown' 
  AND city != 'Local';

-- 3. Preview top locations setelah cleanup
SELECT 
    CASE 
        WHEN city IS NOT NULL AND city != 'Unknown' THEN CONCAT(city, ', ', COALESCE(country, ''))
        WHEN country IS NOT NULL THEN country
        ELSE 'Unknown Location'
    END as location,
    COUNT(*) as views
FROM page_views
WHERE city IS NOT NULL 
  AND city != 'Unknown' 
  AND city != 'Local'
  AND country IS NOT NULL
GROUP BY location
ORDER BY views DESC
LIMIT 10;
