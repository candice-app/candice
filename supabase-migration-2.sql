-- Run this in your Supabase SQL editor at https://supabase.com/dashboard
-- Migration: phone, photo_url, gift_wishlist

-- Add phone to my_profile
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add photo_url to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add gift_wishlist (JSONB array of wish items) to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gift_wishlist JSONB DEFAULT '[]'::jsonb;

-- Ensure phone exists on contacts (already in original schema, but safe to add)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;

-- Supabase Storage: create a public bucket called 'contact-photos'
-- (do this from the Storage tab in the Supabase dashboard, not via SQL)
-- Bucket settings: public read, authenticated write
