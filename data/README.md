# Data layout

```text
data/
  manga/<case>/page_manga_<n>.jpg     montage of the six input panels, right-to-left reading order
  videos/<case>/<method>.mp4          method in {ours, animaker, vimax, storymem, mangadirect}
```

Cases (20): elf2, elf3, goblin, mado, dualjustice1, lovehina, kick, dualjustice2, burari, lovehina_vol01,
paradon, rent_a_girlfriend, baseball, tadaima, slap_shot_girls, lovehina_vol14, hisoka_returns,
hakura_refrain, aoni_rakurai, iseoji.

All videos are re-encoded to H.264 (at most 960x540, 24 fps, CRF 26, faststart, AAC 96k) so they load
quickly and play in sync. StoryMem outputs have no audio track; sound is muted by default for all videos.
The page number of manga pages per case is listed in `CASES` in `index.js`.
