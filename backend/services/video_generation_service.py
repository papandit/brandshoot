from google import genai
from google.genai import types
import time
import os
import uuid
from config import config
from utils.image_utils import UPLOAD_DIR

client = genai.Client(api_key=config.GEMINI_API_KEY)

def generate_video_sync(user_prompt: str, aspect_ratio: str = "9:16", resolution: str = "720p"):
    """
    Generate video using Gemini Veo model and wait for completion
    Returns video URI directly (blocking call)
    """
    try:
        print(f"[Video Generation] Starting video generation...")
        # print(f"[Video Generation] Prompt: {user_prompt}")
        print(f"[Video Generation] Aspect Ratio: {aspect_ratio}, Resolution: {resolution}")

        # models = client.models.list()

        # # Print them out
        # for model in models:
        #     print(f"Name: {model.name}")
        #     print(f"Description: {model.description}")
        #     # print(f"Supported Methods: {model.supported_methods}")
        #     print("-" * 40)

        
        operation = client.models.generate_videos(
            # model="veo-3.1-standard-generate-preview",
            model="veo-3.1-generate-preview",
            prompt=user_prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                resolution=resolution
            ),
        )
        
        print(f"[Video Generation] Operation started: {operation.name}")
        print(f"[Video Generation] Waiting for video generation to complete...")
        
        print(f"[Video Generation] Operation: {operation.name}")
        while not operation.done:
            print("Waiting for video...")
            time.sleep(10)
            # REFRESH the operation object
            operation = client.operations.get(operation) 
            
        # 3. Download the generated video and serve it from our own /uploads route.
        #    The raw Veo file URI requires the API key to access, so a browser can't
        #    play or download it directly. We fetch the bytes here (the key is
        #    available server-side) and save an .mp4 the frontend can use normally.
        if operation.response:
            generated_video = operation.response.generated_videos[0]
            client.files.download(file=generated_video.video)

            filename = f"ad_{uuid.uuid4().hex}.mp4"
            file_path = os.path.join(UPLOAD_DIR, filename)
            generated_video.video.save(file_path)

            url_path = f"{UPLOAD_DIR}/{filename}"
            print(f"[Video Generation] Saved video to {url_path}")
            return url_path
        else:
            raise RuntimeError("Generation failed or was cancelled.")

        
        # Extract video URI
        # if hasattr(operation, 'response') and operation.response:
        #     generated_video = operation.response.generated_videos[0]
        #     video_uri = generated_video.video.uri
        #     print(f"[Video Generation] Video URI: {video_uri}")
        #     return video_uri
        # else:
        #     raise RuntimeError("Video generation completed but no video found")
        
    except Exception as e:
        print(f"[Video Generation] Error: {str(e)}")
        raise e


def poll_video_operation(operation_name: str):
    """
    Poll for video generation completion
    Returns operation status and result if done
    """
    try:
        print(f"[Video Generation] Polling operation: {operation_name}")
        print(f"[Video Generation] Operation name type: {type(operation_name)}")
        
        # Get the operation using the name string (positional argument)
        operation = client.operations.get(operation_name)
        
        print(f"[Video Generation] Operation object type: {type(operation)}")
        print(f"[Video Generation] Operation done status: {operation.done if hasattr(operation, 'done') else 'N/A'}")
        
        if operation.done:
            print(f"[Video Generation] Operation {operation_name} completed!")
            if hasattr(operation, 'response') and operation.response:
                generated_video = operation.response.generated_videos[0]
                video_uri = generated_video.video.uri
                print(f"[Video Generation] Video URI: {video_uri}")
                return {
                    "done": True,
                    "success": True,
                    "video_uri": video_uri
                }
            else:
                print(f"[Video Generation] Operation completed but no video found")
                return {
                    "done": True,
                    "success": False,
                    "error": "No video generated"
                }
        else:
            print(f"[Video Generation] Operation {operation_name} still in progress...")
            return {
                "done": False,
                "success": False
            }
            
    except Exception as e:
        print(f"[Video Generation] Error polling operation: {str(e)}")
        return {
            "done": True,
            "success": False,
            "error": str(e)
        }


def refine_prompt_with_ai(user_prompt: str, category: str = "general"):
    """
    Use Gemini to refine and enhance the user's prompt for better video generation
    Uses category-specific templates for professional results
    """
    try:
        print(f"[Prompt Refinement] Original prompt: {user_prompt}")
        print(f"[Prompt Refinement] Category: {category}")
        
        # Category-specific refinement templates
        category_templates = {
            "jewelry": """Create a luxury jewelry advertisement prompt following this structure:

Style: High-end UGC-style promotional video, cinematic realism, 9:16 vertical format
Visual Quality: Shot on high-end smartphone with professional lighting, warm premium tones, shallow depth of field, crisp textures
Setting: Upscale boutique or elegant home setting with premium lighting
Subject: Well-groomed Indian person showcasing jewelry piece
Camera: Slow cinematic push-in, natural handheld micro-movements, shallow depth of field with bokeh
Lighting: Soft directional light highlighting jewelry sparkle and textures, high contrast premium grading
Action: Natural gestures, genuine expressions, jewelry as hero element
Dialogue: Natural Hinglish commentary about craftsmanship, design, and premium quality
Duration: 9-12 seconds with scene flow breakdown
Details: Include specific jewelry movements (rotation, close-ups of gems), light reflections, elegant presentation""",

            "fashion": """Create a fashion/apparel advertisement prompt following this structure:

Style: Instagram Reels aesthetic, trendy UGC-style, 9:16 vertical format
Visual Quality: High-quality smartphone footage, vibrant colors, sharp details, modern color grading
Setting: Urban trendy location or stylish home setting with good natural light
Subject: Young fashionable Indian person wearing the featured apparel
Camera: Dynamic movements - slow-motion walks, twirls, close-up details, medium to close shots
Lighting: Natural bright lighting or golden hour, highlighting fabric textures and colors
Action: Confident movements, outfit reveals, detail shots of fabric/accessories
Dialogue: Casual Hinglish about style, comfort, versatility, and trend appeal
Duration: 9-12 seconds with quick cuts matching energy
Details: Include fabric movement, texture close-ups, styling tips, multiple angles""",

            "electronics": """Create a tech product advertisement prompt following this structure:

Style: Modern tech review UGC-style, sleek and professional, 9:16 vertical format
Visual Quality: Crisp 4K-style footage, clean backgrounds, product as focal point
Setting: Modern minimalist desk setup or tech-friendly environment with clean aesthetics
Subject: Tech-savvy Indian reviewer demonstrating product features
Camera: Smooth product reveals, close-ups of features, over-shoulder shots, stable movements
Lighting: Clean bright lighting highlighting product design and screen clarity
Action: Product interaction, feature demonstrations, hands-on usage, screen showcases
Dialogue: Informative Hinglish about specs, features, performance, and value
Duration: 9-12 seconds with feature highlights
Details: Include product close-ups, UI demonstrations, size comparisons, key feature callouts""",

            "beauty": """Create a beauty/cosmetics advertisement prompt following this structure:

Style: Beauty influencer UGC-style, Instagram Reels aesthetic, 9:16 vertical format
Visual Quality: Soft focus beauty lighting, vibrant colors, skin-tone accurate grading
Setting: Well-lit vanity setup or bathroom with clean aesthetic background
Subject: Indian beauty enthusiast demonstrating product application
Camera: Close-up face shots, product close-ups, application process, before/after angles
Lighting: Ring light or soft diffused lighting for flattering skin tones and product colors
Action: Product application, texture showcases, blending techniques, final look reveal
Dialogue: Excited Hinglish about texture, pigmentation, longevity, and results
Duration: 9-12 seconds showing application to result
Details: Include product texture close-ups, skin interaction, color payoff, glow/finish shots""",

            "food": """Create a food/dining advertisement prompt following this structure:

Style: Food review UGC-style, premium dining aesthetic, 9:16 vertical format
Visual Quality: Cinematic food photography style, warm tones, appetizing color grading, sharp textures
Setting: Restaurant interior or home kitchen with premium ambiance, wooden tables, designer elements
Subject: Food enthusiast Indian reviewer with genuine expressions
Camera: Slow push-in to food, close-ups of textures, steam rising, natural handheld feel
Lighting: Warm directional light on food, highlights on textures and plating, soft shadows
Action: Food presentation, genuine reactions, subtle gestures toward dish, occasional taste moments
Dialogue: Enthusiastic Hinglish about taste, presentation, ambiance, and overall experience
Duration: 9-12 seconds with food as hero element
Details: Include steam/heat visuals, texture close-ups, plating details, ambient restaurant sounds""",

            "automotive": """Create an automotive advertisement prompt following this structure:

Style: Premium car showcase UGC-style, cinematic automotive aesthetic, 9:16 vertical format
Visual Quality: High-end production value, dynamic shots, sleek reflections, premium grading
Setting: Urban roads, scenic drives, or premium showroom with dramatic lighting
Subject: Car enthusiast or owner showcasing vehicle features
Camera: Smooth tracking shots, detail close-ups of features, interior/exterior reveals, dynamic angles
Lighting: Dramatic lighting highlighting car curves and reflections, golden hour or studio lighting
Action: Car movements, door opens, feature demonstrations, driving shots, interior comfort showcase
Dialogue: Confident Hinglish about performance, features, design, and driving experience
Duration: 9-12 seconds with dynamic scene transitions
Details: Include reflection details, LED light showcases, interior luxury shots, smooth motion"""
        }
        
        # Get category-specific template or use general template
        template = category_templates.get(category.lower(), """Create a professional advertisement video prompt with:
- Cinematic 9:16 vertical format
- High-quality UGC-style production
- Clear camera movements and lighting details
- Natural Hinglish dialogue
- 9-12 second duration with scene breakdown
- Specific visual and audio details""")
        
        refinement_instruction = f"""You are an expert at crafting detailed video generation prompts for Gemini Veo model.

{template}

CRITICAL INSTRUCTIONS:
1. Transform the user's basic idea into a DETAILED, PROFESSIONAL prompt
2. Include specific timings (0-3s, 3-6s, etc.) if relevant
3. Specify camera movements (push-in, over-shoulder, close-up, etc.)
4. Detail lighting setup (warm tones, soft directional, RGB, etc.)
5. Describe setting with specific props and ambiance
6. Include subject description (appearance, clothing, expressions)
7. Add natural Hinglish dialogue in curly braces {{like this}}
8. Specify visual quality (cinematic, UGC-style, color grading)
9. Keep it detailed but focused on the core message
10. Make it production-ready for video generation

Return ONLY the refined prompt, nothing else. No explanations or meta-commentary.

User's basic idea: {user_prompt}

Create a detailed, professional video generation prompt:"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=refinement_instruction
        )
        
        refined_prompt = response.text.strip()
        # Remove all * characters and # characters
        refined_prompt = refined_prompt.replace("*", "")
        refined_prompt = refined_prompt.replace("#", "")
        print(f"[Prompt Refinement] Refined prompt: {refined_prompt}")
        
        return refined_prompt
        
    except Exception as e:
        print(f"[Prompt Refinement] Error: {str(e)}")
        raise e
