# Data Layout

The study uses the same 8 case folders for Part 1 and Part 2:

- `dualjustice1`
- `dualjustice2`
- `elf2`
- `elf3`
- `goblin`
- `kick`
- `lovehina`
- `mado`

## Part 1: storyboard images

Put 5 PNG files in each case folder:

```text
data/
  part1/
    dualjustice1/
      ours.png
      animaker.png
      storydiffusion.png
      storyiter.png
      anystory.png
    dualjustice2/
      ours.png
      animaker.png
      storydiffusion.png
      storyiter.png
      anystory.png
    ...
    mado/
      ours.png
      animaker.png
      storydiffusion.png
      storyiter.png
      anystory.png
```

## Part 2: videos

Put 4 MP4 files in each case folder:

```text
data/
  part2/
    dualjustice1/
      ours.mp4
      animaker.mp4
      vimax.mp4
      storymem.mp4
    dualjustice2/
      ours.mp4
      animaker.mp4
      vimax.mp4
      storymem.mp4
    ...
    mado/
      ours.mp4
      animaker.mp4
      vimax.mp4
      storymem.mp4
```

The page shows these files to users only as `Option A`, `Option B`, etc. The real method names are still stored in the submitted data.
