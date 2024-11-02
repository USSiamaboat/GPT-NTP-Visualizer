# GPT Next Token Prediction Visualizer

Weighted tree of clickable predictions for local sequential prediction from a transformer model

## Motivation

It can be difficult to do a sanity-check for the thought process of an LLM while fine-tuning.
An interactive and information-dense visual interface can help resolve a part of this issue.

Also, I thought it would be fun to play around with

## Implementation Notes

This was originally built as a personal tool but later adapted as a sharable web interface.
The local experience is mostly seamless, but there exist a few issues with this public version:

1. **Models are *very* large:** I used a slightly modified and fine-tuned version GPT-2 with a size of ~650mb.
   Making the default behavior to always download such a file is probably not advisable.
   TODO: Come up with and explain solution
2. **A *very* specific model format is required:** Because this is a "project of the month",
   it is beyond the scope of my goals to make this compatible with a greater selection of models
   TODO: Come up with and explain solution
3. **Models shouldn't run locally anyways:** Yes, but then I wouldn't be able to host it for free with anywhere
   the ease at which I can with github pages. Also, I have midterms so I'm not going to make a full web app for
   this month's project.
