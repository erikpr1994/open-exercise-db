# Exercise animations (prototype)

Turns the two public-domain photos of an exercise into a looping animation
of one flat-shaded character, drawn in Blender.

1. `pose.py` finds the body pose in `images/<id>/0.jpg` and `1.jpg` with
   MediaPipe Pose Landmarker.
2. `character.py` builds the character once with MPFB (MakeHuman for
   Blender): body, skeleton, ponytail, eyebrows.
3. `animate.py` levels the camera tilt and turn, moves the skeleton from
   pose 0 to pose 1 and back, and renders the frames with Cycles.

## Run

```sh
render/setup.sh
render/run.sh bodyweight-squat dumbbell-lunges
```

The GIFs go to `render/.work/out/`. One exercise takes about 5 minutes on
4 CPU cores.

## Licences

- Photos: public domain (free-exercise-db, Unlicense).
- MakeHuman system assets: CC0.
- MPFB add-on: GPL-3.0. It runs as a tool and ships nothing in the output.
- MediaPipe and its pose model: Apache-2.0.

## Status

- The legs, hips and feet are right on the exercises tested.
- The arms and upper back are often wrong: MediaPipe guesses depth from one
  front photo. The next step replaces MediaPipe with SAM 3D Body, which
  needs `HF_TOKEN` with access to `facebook/sam-3d-body-dinov3`.
- No equipment props yet.
- No scheduled job yet.
