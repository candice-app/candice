-- Migration 43 — Lot 6 : sourcing paiement sur wishlist_items
--
-- Règle produit : prix > 200 € → requires_payment_sourcing = true.
-- Ce lot pose uniquement le flag et le champ. La logique d'auto-détection
-- (comparaison au prix de l'item) et le parcours sourcing seront
-- implémentés au Lot 8/9. NOTE : wishlist_items n'a pas encore de colonne
-- price — à ajouter quand le parcours de saisie de prix sera construit.
--
-- La policy existante "owner_wishlist_items" couvre déjà ces nouvelles colonnes.

ALTER TABLE wishlist_items
  ADD COLUMN IF NOT EXISTS requires_payment_sourcing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_modalities        JSONB;
