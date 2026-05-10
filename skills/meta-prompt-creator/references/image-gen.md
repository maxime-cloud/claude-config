# Image Generation Prompt Reference

## Platform Comparison

| Platform | Best for | Prompt style |
|----------|---------|-------------|
| **Midjourney v6** | Artistic impact, cinematic visuals, emotional resonance | Style-first, mood-driven |
| **DALL-E 3** | Literal accuracy, text-in-image, exact compositions | Narrative, descriptive sentences |
| **Stable Diffusion / SDXL** | Full control, custom fine-tunes, technical precision | Tag-based, negative prompts critical |
| **Flux (Black Forest Labs)** | Photorealism, fast iteration | Natural language + style tags |

---

## Midjourney v6

### Structure
```
[subject + action], [environment], [lighting], [mood], [art style / medium / artist references], [camera/lens if photographic]
--ar [ratio] --v 6 --style raw --stylize [0-1000]
```

### Effective techniques
- **Style anchoring**: Reference specific artists, art movements, or media ("in the style of Greg Rutkowski", "Bauhaus poster design", "Studio Ghibli watercolor")
- **Lighting specifics**: "golden hour", "rim lighting", "soft diffused light", "neon-lit", "volumetric fog"
- **Quality words that work**: "cinematic", "hyperrealistic", "award-winning photography", "editorial photography"
- **Negative space control**: Use `--no [elements]` for exclusions
- **Parameters that matter**:
  - `--ar 16:9` / `--ar 1:1` / `--ar 9:16` for ratio
  - `--style raw` for less stylized, more literal
  - `--stylize 0` for minimal artistic interpretation, `--stylize 750` for heavy
  - `--chaos 0-100` for variation

### Example — product shot
```
Luxury skincare serum bottle, floating on water droplets, studio white background, 
dramatic side lighting with soft shadows, minimalist aesthetic, commercial product photography, 
macro lens, ultra-sharp focus, photorealistic
--ar 1:1 --v 6 --style raw --stylize 200
```

---

## DALL-E 3

### Structure
Write as a natural language description — DALL-E 3 reads literally and handles narrative better than tags.

```
[Full sentence describing the scene]. [Lighting and atmosphere]. [Art style and medium]. [Technical specs if needed].
```

### Effective techniques
- **Be explicit about what's in frame**: "A close-up shot of..." not "close-up"
- **Describe the absence**: "The background is completely white, no shadows" 
- **Art style phrasing**: "painted in the style of watercolor illustration", "digital art in a flat design style", "photorealistic render"
- **Text in image**: Works reliably — just quote the text exactly: `containing the words "Hello World" in a bold sans-serif font`
- **No negative prompts** (they're not supported — describe what you want instead)
- **Avoid celebrity names** — it will refuse; describe physical characteristics instead

### Example — blog header
```
A wide panoramic illustration of a developer's desk at night, multiple monitors showing colorful code, 
warm lamp light casting soft orange glow on mechanical keyboard and coffee mug, 
cozy and focused atmosphere, flat digital illustration style with subtle gradients, 
no people visible, high detail.
```

---

## Stable Diffusion / SDXL / Flux

### Positive prompt structure
```
[subject], [style], [rendering engine/quality], [lighting], [camera], [quality boosters]
```

### Negative prompt (always include)
```
ugly, blurry, low quality, deformed, bad anatomy, watermark, signature, text, 
extra limbs, duplicate, morbid, poorly drawn face, out of frame, cut off
```

### Quality boosters (add at end of positive prompt)
```
masterpiece, best quality, ultra-detailed, 8k uhd, sharp focus, professional, 
award winning, highly detailed, photorealistic
```

### Effective techniques
- **LoRA notation**: `<lora:style_name:0.8>` to apply fine-tuned styles
- **Attention weights**: `(golden hair:1.4)` increases focus, `[background:0.8]` de-emphasizes
- **Prompt ordering**: Earlier tokens have more weight — put the most important elements first
- **CFG scale**: 7-9 for balanced, 12+ for strict prompt adherence (can over-saturate)
- **Steps**: 20 for speed, 30-40 for quality

### Example — character concept art
```
young female astronaut, inside futuristic space station, looking out porthole at earth, 
concept art, trending on artstation, cinematic lighting, volumetric atmosphere, 
detailed suit with NASA patches, soft blue ambient light, wide angle shot,
masterpiece, best quality, ultra-detailed, sharp focus

Negative: ugly, deformed, bad anatomy, blurry, duplicate, extra limbs, poorly drawn hands
```

---

## Universal tips

1. **Iterate on style first, content second.** Get the look/feel right before perfecting composition details.
2. **Save working prompts.** When you find something that works, document it as a template.
3. **Seed consistency**: Use the same seed for variations on a working composition (SD/Midjourney `--seed`).
4. **Reference images** (Midjourney `--sref`, SD `img2img`): 10x more effective than describing style in words.
5. **Aspect ratio before upscaling**: Set the right ratio from the start — cropping after degrades quality.
