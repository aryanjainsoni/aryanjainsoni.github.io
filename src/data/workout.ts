// BASECAMP → GYM: the weekly V-shape plan (aesthetic, not bodybuilder: wide back, round shoulders, tight waist).
// Photos: public/images/workout/<id>__0.webp (start) and __1.webp (end) — from free-exercise-db (public domain, Unlicense).
// Edit sets / reps / cues here; the Gym tab renders straight from this file.
export type Ex = { id: string; name: string; sets: string; reps: string; rest: string; cue: string; muscle: string };
export type Day = { key: string; day: string; focus: string; warmup: string[]; lifts: Ex[]; cooldown: string[] };

const img = (name: string) => name.replace(/ /g, '_').toLowerCase();
const ex = (name: string, sets: string, reps: string, rest: string, muscle: string, cue: string): Ex => ({ id: img(name), name, sets, reps, rest, muscle, cue });

export const CARDIO = { title: 'Incline walk', detail: '30 min · incline 15 · speed 4 km/h', tip: 'Do it AFTER lifting so your strength is fresh for the weights. Don’t hold the rails — swing your arms. Roughly 230–260 kcal.' };

export const RULES = [
  ['Progressive overload', 'When every set hits the top of the rep range with clean form, add 2.5 kg (or 1–2 reps) next time.'],
  ['Leave 1–2 reps in the tank', 'Main lifts stop about 2 reps before failure. The last set of an isolation move can go to failure.'],
  ['Tempo', '1 second up, 2–3 seconds down. Control beats weight — every rep, full range.'],
  ['Build the V', 'Back and side delts get the most sets. That is what makes the waist look small.'],
  ['Tight waist', 'No heavy weighted side bends. Obliques are trained with rotation and anti-rotation (twists, chops, side planks).'],
  ['Neck', 'Very light plates, slow reps, never jerk. Skip it on any neck pain.'],
  ['Pain rule', 'Muscle burn is fine. Sharp or joint pain = stop that exercise.'],
] as const;

export const WEEK: Day[] = [
  {
    key: 'mon', day: 'Monday', focus: 'Back · Biceps · Abs · Arms',
    warmup: ['5 min easy incline walk or cross-trainer', 'Arm circles — 20 each way', 'Band pull-aparts — 2 × 15', 'Cat–cow — 10 slow reps', 'Scapular pull-ups — 2 × 8', 'Light lat pulldown — 1 × 15 at ~50%'],
    lifts: [
      ex('Wide-Grip Lat Pulldown', '4', '8–12', '90 s', 'Lats (width)', 'Pull the elbows down to your ribs, chest up. Don’t swing your body back.'),
      ex('Pullups', '3', 'max', '2 min', 'Lats · biceps', 'Full hang at the bottom, chin over the bar, 2-second lowering. Use the assisted machine if needed.'),
      ex('Seated Cable Rows', '3', '10–12', '90 s', 'Mid back (thickness)', 'Squeeze the shoulder blades together for 1 second. Keep the lower back neutral, no rounding.'),
      ex('One-Arm Dumbbell Row', '3', '10 / side', '60 s', 'Lats', 'Row the dumbbell to your hip, not your chest. Elbow close to the body.'),
      ex('Straight-Arm Pulldown', '3', '12–15', '60 s', 'Lats', 'Arms almost straight; you should feel the lats, not the triceps.'),
      ex('Barbell Curl', '3', '8–10', '60 s', 'Biceps', 'Elbows pinned to your sides, no hip swing.'),
      ex('Hammer Curls', '3', '10–12', '60 s', 'Brachialis · forearms', 'Neutral grip builds the muscle under the biceps — thicker-looking arms.'),
      ex('Palms-Up Barbell Wrist Curl Over A Bench', '2', '15', '45 s', 'Forearms', 'Small, slow range. Only the wrists move.'),
      ex('Hanging Leg Raise', '3', '10–12', '60 s', 'Lower abs', 'Curl the pelvis up, not just the legs. No swinging.'),
      ex('Plank', '3', '45 s', '45 s', 'Core', 'Ribs down, glutes tight, one straight line from head to heels.'),
    ],
    cooldown: ['Lat stretch on a bench or door frame — 2 × 30 s each side', 'Child’s pose — 45 s', 'Biceps wall stretch — 30 s each arm', 'Doorway chest opener — 30 s', 'Cobra (abs) — 30 s', 'Forearm flexor stretch — 30 s each'],
  },
  {
    key: 'tue', day: 'Tuesday', focus: 'Chest · Triceps · Obliques',
    warmup: ['5 min easy cardio', 'Arm swings — 20', 'Band dislocates — 15', 'Push-up plus — 2 × 10', 'Light dumbbell press — 1 × 15', 'Wrist circles — 20'],
    lifts: [
      ex('Incline Dumbbell Press', '4', '8–10', '90 s', 'Upper chest', 'Bench at ~30°. Upper chest gives the “armour” look. Elbows at ~45°, not flared.'),
      ex('Dumbbell Bench Press', '3', '10', '90 s', 'Chest', 'Shoulder blades pinned back and down. Control the weight to the chest.'),
      ex('Cable Crossover', '3', '12–15', '60 s', 'Inner chest', '“Hug a tree” arc; squeeze for 1 second where the hands meet.'),
      ex('Dips - Chest Version', '3', 'max', '90 s', 'Lower chest · triceps', 'Lean slightly forward. Only go as deep as your shoulders feel comfortable.'),
      ex('Triceps Pushdown - Rope Attachment', '3', '12', '60 s', 'Triceps', 'Split the rope at the bottom; upper arms stay still.'),
      ex('Standing Dumbbell Triceps Extension', '3', '12', '60 s', 'Triceps (long head)', 'The overhead stretch builds the long head. Keep elbows narrow.'),
      ex('Russian Twist', '3', '20', '45 s', 'Obliques', 'Rotate from the ribs, not only the arms. Slow and controlled.'),
      ex('Side Bridge', '3', '30 s / side', '30 s', 'Obliques', 'Hips high, body in a straight line — anti-bend strength keeps the waist tight.'),
    ],
    cooldown: ['Doorway pec stretch — 2 × 30 s', 'Overhead triceps stretch — 30 s each arm', 'Cross-body shoulder stretch — 30 s each', 'Standing side bend (obliques) — 30 s each side', 'Child’s pose — 45 s'],
  },
  {
    key: 'wed', day: 'Wednesday', focus: 'Legs · Shoulders · Neck · Abs',
    warmup: ['5 min cycle', 'Leg swings — 15 each leg, front and side', 'Bodyweight squats — 15', 'Walking lunges — 10', 'Hip circles — 10 each way', 'Band lateral raises — 15', 'Slow neck rolls — 5 each way'],
    lifts: [
      ex('Barbell Squat', '4', '6–8', '2 min', 'Quads · glutes', 'Brace your core, knees track over the toes, go to at least parallel if your mobility allows.'),
      ex('Romanian Deadlift', '3', '8–10', '2 min', 'Hamstrings · glutes', 'Push the hips back, bar close to the legs, flat back.'),
      ex('Dumbbell Lunges', '3', '10 / leg', '90 s', 'Legs', 'Long step, torso tall, back knee close to the floor.'),
      ex('Lying Leg Curls', '3', '12', '60 s', 'Hamstrings', 'Slow lowering — strong hamstrings protect the knees.'),
      ex('Standing Calf Raises', '3', '15', '45 s', 'Calves', 'Full stretch at the bottom, 1-second pause at the top.'),
      ex('Seated Dumbbell Press', '3', '8–10', '90 s', 'Shoulders', 'Don’t flare the ribs; press slightly in front of the face.'),
      ex('Side Lateral Raise', '4', '12–15', '45 s', 'Side delts (WIDTH)', 'THE V-shape move. Lead with the elbows, stop at shoulder height, light and strict.'),
      ex('Lying Face Down Plate Neck Resistance', '2', '15', '45 s', 'Neck (back)', 'Tiny plate, slow reps. Never jerk the neck.'),
      ex('Lying Face Up Plate Neck Resistance', '2', '15', '45 s', 'Neck (front)', 'Chin tucks up slowly; hold the plate with both hands.'),
      ex('Cable Crunch', '3', '15', '45 s', 'Abs', 'Crunch the ribs toward the hips; the hips don’t move.'),
    ],
    cooldown: ['Standing quad stretch — 30 s each', 'Hamstring stretch — 30 s each', 'Pigeon / glute stretch — 30 s each', 'Calf wall stretch — 30 s each', 'Neck side stretch — 20 s each side', 'Cross-body shoulder stretch — 30 s each'],
  },
  {
    key: 'thu', day: 'Thursday', focus: 'Back · Biceps · Obliques · Arms',
    warmup: ['5 min rowing machine (easy)', 'Band pull-aparts — 2 × 15', 'Dead hang — 2 × 20 s', 'Scapular pull-ups — 2 × 8', 'Light cable row — 1 × 15'],
    lifts: [
      ex('Pullups', '4', '6–10', '2 min', 'Lats', 'Add weight once you can do 10 clean reps.'),
      ex('Bent Over Barbell Row', '3', '8–10', '2 min', 'Back thickness', 'Hinge to ~45°, pull to the belly button, neutral spine.'),
      ex('Close-Grip Front Lat Pulldown', '3', '10', '90 s', 'Lower lats', 'Lean back slightly, pull to the upper chest.'),
      ex('Reverse Flyes', '3', '15', '45 s', 'Rear delts', 'Rear delts make the shoulders look round in 3D. Thumbs slightly down.'),
      ex('Face Pull', '3', '15', '45 s', 'Rear delts · posture', 'Pull to the forehead and rotate the hands back. Saves your posture.'),
      ex('Incline Dumbbell Curl', '3', '10', '60 s', 'Biceps (long head)', 'Arms hang behind the body for a long stretch on the biceps.'),
      ex('Concentration Curls', '2', '12', '45 s', 'Biceps peak', 'Squeeze hard at the top, lower slowly.'),
      ex('Reverse Barbell Curl', '2', '12', '45 s', 'Forearms', 'Overhand grip trains the forearms and brachioradialis.'),
      ex('Air Bike', '3', '20', '45 s', 'Obliques · abs', 'Slow; elbow toward the opposite knee.'),
      ex('Standing Cable Wood Chop', '3', '12 / side', '45 s', 'Obliques', 'Rotate through the trunk; hips stay stable.'),
    ],
    cooldown: ['Lat stretch — 2 × 30 s each side', 'Child’s pose — 45 s', 'Biceps wall stretch — 30 s each', 'Standing side bend — 30 s each side', 'Forearm extensor stretch — 30 s each'],
  },
  {
    key: 'fri', day: 'Friday', focus: 'Chest · Triceps · Abs',
    warmup: ['5 min easy cardio', 'Band dislocates — 15', 'Push-ups — 2 × 10', 'Light bench press — 1 × 15', 'Band triceps pushdown — 15'],
    lifts: [
      ex('Barbell Bench Press - Medium Grip', '4', '6–8', '2 min', 'Chest', 'Feet planted, slight arch, bar to mid-chest, shoulder blades pinned.'),
      ex('Low Cable Crossover', '3', '12', '60 s', 'Upper chest', 'Low-to-high arc draws the upper-chest line.'),
      ex('Pushups', '3', 'max', '60 s', 'Chest · triceps', 'Body in one line, chest touches the floor.'),
      ex('Close-Grip Barbell Bench Press', '3', '8', '90 s', 'Triceps', 'Hands shoulder-width, elbows tucked.'),
      ex('EZ-Bar Skullcrusher', '3', '10', '60 s', 'Triceps', 'Lower just behind the head; elbows stay still.'),
      ex('Ab Roller', '3', '8–12', '60 s', 'Abs', 'Ribs down. Roll out only as far as your lower back stays flat.'),
      ex('Hanging Leg Raise', '3', '10', '60 s', 'Lower abs', 'Slow; no swinging.'),
      ex('Plank', '2', '60 s', '45 s', 'Core', 'Breathe while bracing.'),
    ],
    cooldown: ['Doorway pec stretch — 2 × 30 s', 'Overhead triceps stretch — 30 s each', 'Cobra — 30 s', 'Child’s pose — 45 s', 'Chest opener with hands behind back — 30 s'],
  },
  {
    key: 'sat', day: 'Saturday', focus: 'Legs · Shoulders · Neck · Obliques',
    warmup: ['5 min cycle', 'Leg swings — 15 each', 'Goblet squat (light) — 12', 'Hip circles — 10 each way', 'Band lateral raises — 15', 'Slow neck rolls — 5 each way'],
    lifts: [
      ex('Leg Press', '4', '10–12', '90 s', 'Quads · glutes', 'Feet shoulder-width, don’t lock the knees, lower back stays on the pad.'),
      ex('Split Squat with Dumbbells', '3', '10 / leg', '90 s', 'Quads · glutes', 'Drop straight down, front heel planted.'),
      ex('Leg Extensions', '3', '12–15', '60 s', 'Quads', 'Pause 1 second at the top.'),
      ex('Seated Calf Raise', '3', '15', '45 s', 'Calves (soleus)', 'Slow stretch at the bottom.'),
      ex('Arnold Dumbbell Press', '3', '10', '90 s', 'All 3 delt heads', 'Rotate the palms as you press.'),
      ex('Cable Seated Lateral Raise', '3', '15', '45 s', 'Side delts (WIDTH)', 'Cables keep tension the whole way — wider shoulders.'),
      ex('Reverse Flyes', '3', '15', '45 s', 'Rear delts', 'Light and strict; squeeze the back of the shoulders.'),
      ex('Lying Face Down Plate Neck Resistance', '2', '15', '45 s', 'Neck', 'Tiny plate, slow; skip on any pain.'),
      ex('Russian Twist', '3', '20', '45 s', 'Obliques', 'Rotate from the ribs.'),
      ex('Side Bridge', '3', '30 s / side', '30 s', 'Obliques', 'Hips high, straight line.'),
    ],
    cooldown: ['Standing quad stretch — 30 s each', 'Hamstring stretch — 30 s each', 'Pigeon stretch — 30 s each', 'Calf wall stretch — 30 s each', 'Neck side stretch — 20 s each side', 'Standing side bend — 30 s each'],
  },
];

export const SUNDAY = { day: 'Sunday', focus: 'Rest & recovery', items: ['8–10k easy steps outdoors', '15 min mobility: hips, thoracic spine, shoulders', 'Sleep 7.5 h+, protein as usual — muscle grows on rest days'] };
