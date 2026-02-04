-- ====================================================
-- Cleanup Script untuk Bot & Debug Traffic dari Stats
-- Jalankan di MySQL untuk membersihkan data yang sudah ada
-- ====================================================

-- 1. Hapus entri dari debug endpoints & bot scanning
DELETE FROM page_views WHERE 
    path LIKE '%/debug%'
    OR path LIKE '%/telescope%'
    OR path LIKE '%/actuator%'
    OR path LIKE '%/api-docs%'
    OR path LIKE '%/wp-admin%'
    OR path LIKE '%/wp-login%'
    OR path LIKE '%xmlrpc%'
    OR path LIKE '%/.env%'
    OR path LIKE '%/.git%'
    OR path LIKE '%phpmyadmin%'
    OR path LIKE '%/mysql%'
    OR path LIKE '%.php'
    OR path LIKE '%/admin.php%'
    OR path LIKE '%/login.php%'
    OR path LIKE '%/config.php%';

-- 2. Hapus entri dari localhost/local IP
DELETE FROM page_views WHERE 
    city = 'Local'
    OR ip_address = '::1'
    OR ip_address = '127.0.0.1'
    OR ip_address LIKE '192.168.%'
    OR ip_address LIKE '10.%'
    OR ip_address LIKE '172.%';

-- 3. Hapus entri dari bot user agents
DELETE FROM page_views WHERE 
    LOWER(user_agent) LIKE '%bot%'
    OR LOWER(user_agent) LIKE '%crawler%'
    OR LOWER(user_agent) LIKE '%spider%'
    OR LOWER(user_agent) LIKE '%scraper%'
    OR LOWER(user_agent) LIKE '%curl%'
    OR LOWER(user_agent) LIKE '%wget%'
    OR LOWER(user_agent) LIKE '%python%'
    OR LOWER(user_agent) LIKE '%java%'
    OR LOWER(user_agent) LIKE '%scanner%'
    OR LOWER(user_agent) LIKE '%monitor%'
    OR user_agent IS NULL;

-- 4. Verifikasi sisa data yang bersih
SELECT 
    COUNT(*) as total_clean_views,
    COUNT(DISTINCT ip_address) as unique_visitors,
    COUNT(DISTINCT path) as unique_pages
FROM page_views;

-- 5. Lihat top 10 pages yang tersisa
SELECT path, COUNT(*) as views 
FROM page_views 
GROUP BY path 
ORDER BY views DESC 
LIMIT 10;

-- 6. Lihat sumber traffic
SELECT country, city, COUNT(*) as views 
FROM page_views 
WHERE country IS NOT NULL
GROUP BY country, city 
ORDER BY views DESC 
LIMIT 10;
