CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT
);

INSERT INTO settings (setting_key, setting_value) VALUES 
('footer_address', 'Jl. Salihara No. 16, Ps. Minggu,\nPasar Minggu,\nSouth Jakarta,\nDKI Jakarta 12520'),
('footer_contact_label', 'Contact Us'),
('instagram_url', '#'),
('twitter_url', '#'),
('facebook_url', '#')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
