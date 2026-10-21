/**
 * Category taxonomy and keyword sets for ELigtas.
 *
 * `DEFAULT_CATEGORIES` is the original MVP taxonomy and stays stable for
 * callers that already depend on it. `EXTENDED_CATEGORIES` is the broader
 * library used by the web app: it follows the kinds of buckets people expect
 * from YouTube/TikTok/Instagram (food, tech, travel, fitness, gaming, music,
 * news, science, finance, pets, ...) while keeping "Other" as the fallback.
 *
 * Keywords are matched as whole words with common inflections, so "said" no
 * longer counts as "ai" and "happy" no longer counts as "app".
 */

export const DEFAULT_CATEGORIES = Object.freeze([
  "Cooking",
  "Tech Tips",
  "Travel",
  "Fitness",
  "Beauty",
  "DIY",
  "Education",
  "Entertainment",
  "Other",
]);

export const EXTENDED_CATEGORIES = Object.freeze([
  "Cooking",
  "Tech Tips",
  "Travel",
  "Fitness",
  "Beauty",
  "DIY",
  "Education",
  "Entertainment",
  "Gaming",
  "Music",
  "Sports",
  "News & Politics",
  "Science & Nature",
  "Finance & Business",
  "Art & Design",
  "Home & Garden",
  "Pets & Animals",
  "Parenting & Family",
  "Motivation",
  "Health & Wellness",
  "ASMR & Relaxation",
  "Pranks & Challenges",
  "Cars & Vehicles",
  "Movies & TV",
  "Vlogs & People",
  "Other",
]);

export const KEYWORDS = Object.freeze({
  Cooking: [
    "recipe", "cook", "bake", "kitchen", "meal", "ingredient", "chef", "food",
    "pasta", "bread", "dessert", "cake", "dinner", "lunch", "breakfast", "sauce",
    "grill", "barbecue", "coffee", "cocktail", "vegan", "vegetarian", "chocolate",
    "pizza", "soup", "salad", "snack", "restaurant",
  ],
  "Tech Tips": [
    "software", "app", "phone", "laptop", "coding", "tutorial", "gadget", "ai",
    "computer", "programming", "javascript", "python", "cybersecurity", "internet",
    "website", "browser", "android", "ios", "windows", "linux", "hardware", "review",
    "api", "database", "cloud",
  ],
  Travel: [
    "travel", "flight", "hotel", "beach", "city", "trip", "vacation", "itinerary",
    "backpacking", "destination", "tourism", "airline", "resort", "roadtrip",
    "adventure", "hike", "camping", "cruise", "passport", "airport",
  ],
  Fitness: [
    "workout", "gym", "exercise", "fitness", "muscle", "cardio", "yoga", "training",
    "run", "running", "strength", "stretch", "pilates", "weightlifting", "athlete",
    "marathon", "squat", "pushup", "kettlebell",
  ],
  Beauty: [
    "makeup", "skincare", "beauty", "hair", "cosmetic", "fragrance", "fashion",
    "outfit", "style", "nails", "salon", "perfume", "sunscreen", "lipstick",
  ],
  DIY: [
    "diy", "craft", "woodwork", "repair", "build", "handmade", "tools", "furniture",
    "renovation", "plumbing", "sewing", "knit", "pottery", "3dprint", "workshop",
  ],
  Education: [
    "learn", "course", "lecture", "study", "school", "exam", "language", "math",
    "history", "lesson", "teacher", "university", "explained",
  ],
  Entertainment: [
    "comedy", "funny", "meme", "show", "standup", "celebrity", "viral", "sketch",
  ],
  Gaming: [
    "gaming", "gameplay", "minecraft", "fortnite", "roblox", "esports", "streamer",
    "playstation", "xbox", "nintendo", "steam", "speedrun", "fps", "rpg", "boss", "loot",
  ],
  Music: [
    "music", "song", "guitar", "piano", "singer", "album", "lyrics", "dance",
    "choreography", "dj", "beat", "remix", "playlist", "concert", "acoustic", "karaoke",
  ],
  Sports: [
    "sport", "football", "soccer", "basketball", "tennis", "baseball", "cricket",
    "golf", "rugby", "hockey", "boxing", "mma", "f1", "racing", "olympics", "match",
    "goal", "league", "championship", "skateboarding", "surfing",
  ],
  "News & Politics": [
    "news", "politics", "election", "government", "president", "war", "protest",
    "policy", "senator", "congress", "breaking", "vote", "parliament", "diplomatic",
    "crisis",
  ],
  "Science & Nature": [
    "science", "space", "physics", "chemistry", "biology", "astronomy", "nasa",
    "experiment", "nature", "climate", "environment", "geology", "ecology",
    "telescope", "volcano", "ocean", "forest",
  ],
  "Finance & Business": [
    "finance", "money", "invest", "stock", "crypto", "business", "startup",
    "marketing", "sales", "entrepreneur", "economy", "budget", "tax", "real estate",
    "career", "job", "salary", "ecommerce", "negotiation",
  ],
  "Art & Design": [
    "art", "drawing", "painting", "design", "illustration", "photography",
    "photoshop", "sculpture", "animation", "graphic", "sketch", "creative", "logo",
    "typography", "watercolor", "digitalart",
  ],
  "Home & Garden": [
    "home", "garden", "plant", "cleaning", "decor", "interior", "furniture", "lawn",
    "renovation", "organization", "houseplant", "landscaping",
  ],
  "Pets & Animals": [
    "pet", "dog", "cat", "puppy", "kitten", "animal", "wildlife", "bird", "fish",
    "aquarium", "rescue", "breed", "parrot", "hamster", "rabbit", "veterinary",
  ],
  "Parenting & Family": [
    "parenting", "baby", "toddler", "kid", "child", "family", "pregnancy",
    "motherhood", "fatherhood", "toys", "newborn", "diaper", "homeschool", "sibling",
  ],
  Motivation: [
    "motivation", "mindset", "habit", "productivity", "success", "discipline",
    "improvement", "goal", "journal", "confidence", "procrastination", "focus",
    "inspiration", "growth",
  ],
  "Health & Wellness": [
    "health", "doctor", "medicine", "symptom", "disease", "mental", "therapy",
    "sleep", "nutrition", "diet", "wellness", "meditation", "anxiety", "depression",
    "hospital", "vaccine",
  ],
  "ASMR & Relaxation": [
    "asmr", "relaxation", "calming", "whisper", "satisfying", "ambient", "lofi",
    "soothing", "tingles", "spa", "massage",
  ],
  "Pranks & Challenges": [
    "prank", "challenge", "dare", "troll", "scare", "reaction",
  ],
  "Cars & Vehicles": [
    "car", "vehicle", "truck", "motorcycle", "engine", "driving", "ev", "tesla",
    "mechanic", "auto", "suv", "sedan", "bike", "bicycle", "garage",
  ],
  "Movies & TV": [
    "movie", "film", "trailer", "series", "netflix", "anime", "cartoon", "actor",
    "actress", "cinema", "episode", "sitcom", "documentary", "marvel", "disney",
  ],
  "Vlogs & People": [
    "vlog", "vlogger", "lifestyle", "diary", "blog", "personal",
  ],
  Other: [],
});
