# FE14 Weapon and Item Canonical Order

This document defines the physical order of FE14 weapon and item records in normalized JSON. Runtime code must preserve this order; it must not sort records to conceal unordered input.

## Weapon Tabs

1. Swords & Katana: Sword, Katana
2. Lances & Naginata: Lance, Naginata
3. Axes & Clubs: Axe, Club
4. Daggers & Shuriken: Dagger, Shuriken
5. Bows & Yumi: Bow, Yumi
6. Tomes & Scrolls: Tome, Scroll
7. Staves & Rods: Staff, Rod
8. Stones: Dragonstone, Beaststone, Other player-available stone weapons

Within a family, use the reviewed English source order. Keep non-DLC entries before DLC or other special entries when the source identifies that distinction. Do not include enemy-only, unused, dummy, debug, placeholder, or inaccessible records in normalized runtime data.

Water Splash is the reviewed `Other player-available stone weapon` after Beaststones in the Stones tab.

## Items

Use the Fire Emblem Wiki item-source order after removing unused records. Keep related categories contiguous:

1. healing and temporary stat items;
2. special consumables and keys;
3. permanent stat boosters;
4. standard promotion and reclass items;
5. DLC and in-game promotion or reclass items beginning with Ebon Wing;
6. skill-teaching and other verified special items.

Ebon Wing and every later legitimate DLC or in-game entry remain included. The source report must list every excluded unused entry and its reason.
