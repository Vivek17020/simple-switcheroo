-- Delete all categories that start with "Jobs/"
DELETE FROM categories 
WHERE name LIKE 'Jobs/%';