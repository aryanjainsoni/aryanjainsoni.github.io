// SMART TYPING vocabulary — used for word suggestions + spelling help in every text box on the site.
// Order matters a little: earlier words rank higher for suggestions. Your own words are learned as you type
// (stored only in this browser) and rank above these. Naya word jodna ho to bas yahan likh do.

const COMMON = `the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or
an will my one all would there their what so up out if about who get which go me when make can like time no just him know take
people into year your good some could them see other than then now look only come its over think also back after use two how our
work first well way even new want because any these give day most us is was are been has had were said did made got went
today tomorrow yesterday morning evening night week month weekend daily weekly plan planned planning
learn learned learning learnt study studied studying studies practice practised practiced revise revision understand understood
read reading write writing wrote written watch watched watching finish finished finishing start started starting complete completed
problem problems question questions solve solved solving solution solutions answer answers concept concepts topic topics chapter
lecture lectures class classes college university course courses assignment assignments project projects exam exams test tests
notes note lesson lessons teacher mentor friend friends family brother sister cousin cousins parents mother father mom dad uncle aunt
internship internships interview interviews resume application applications applied apply company companies role roles job jobs
career skill skills experience team teammate manager meeting meetings call calls message email linkedin github leetcode website site
code coding coded program programming programmer developer development software hardware computer laptop phone app apps
python java javascript typescript react html css sql mysql database databases api backend frontend server cloud deploy deployed
function functions variable variables array arrays string strings list lists tree trees graph graphs stack queue heap hash map
linked recursion recursive loop loops pointer pointers binary search sort sorting dynamic programming greedy algorithm algorithms
complexity time space optimal brute force pattern patterns sliding window prefix sum matrix pairs subarray substring
machine model models data dataset training trained accuracy precision recall feature features regression classification neural
network networks deep learning artificial intelligence prediction predict streamlit pandas numpy scikit vedantu course
gym workout workouts exercise exercises push pull legs chest back shoulders arms biceps triceps core abs squat squats deadlift bench
press rows curls sets reps weight weights cardio incline treadmill walk walked walking steps run running swim swimming stretch
protein carbs fat fibre fiber calories calorie diet meal meals breakfast lunch dinner snack snacks water sleep slept rest recovery
creatine whey supplement supplements vitamin vitamins healthy health body muscle muscles strength strong energy tired
happy sad angry stressed excited motivated focused focus discipline consistent consistency habit habits goal goals progress
improve improved improving better best worse worst great good bad nice fine okay really very much more less many few little
something anything nothing everything someone anyone everyone because although however therefore again still already almost
always never sometimes often usually maybe probably actually finally especially important difficult easy hard simple clear
first second third last next before after during while until since between through without within around about above below
should would could might must need needs needed want wanted try tried trying help helped helping feel felt feeling think thought
remember forgot forget decide decided choose chose change changed keep kept stay stayed leave left bring brought buy bought
talk talked talking tell told ask asked show showed find found give gave call called move moved open opened close closed
spend spent save saved build built create created fix fixed test tested check checked share shared post posted publish
because thanks thank please sorry welcome hello great amazing awesome interesting productive grateful proud win wins hard
pune jaipur india ascent aryan jain`;

// Hinglish — so these are suggested and never "corrected"
const HINGLISH = `hai hain tha thi the ho hoga hogi kya kyu kyun kaise kab kaha kahan kaun kitna kitne nahi nhi haan han accha acha
theek thik bahut bohot thoda zyada abhi aaj kal parso subah shaam raat din hafta mahina saal kaam karna karo kiya kiye karunga
karenge kar raha rahi rahe hu hoon main mera meri mere tera teri tum tumhara aap apna apni hum hamara yaar bhai dost ghar
padhai padhna likhna seekha seekhna samjha samajh chalo chala gaya gayi aaya aayi dekha dekho socha lagta laga achha bas aur
ya lekin phir fir sab kuch koi jab tab agar toh bhi wala wali wale isse usse uske iske yeh woh yaha waha`;

export const WORDS: string[] = [...new Set(`${COMMON} ${HINGLISH}`.split(/\s+/).filter(Boolean))];

// Common typos -> fixed automatically when you finish the word (Backspace right after = undo)
export const TYPOS: Record<string, string> = {
  teh: 'the', hte: 'the', adn: 'and', nad: 'and', taht: 'that', thta: 'that', wiht: 'with', whit: 'with', fro: 'for',
  recieve: 'receive', recieved: 'received', beleive: 'believe', definately: 'definitely', definatly: 'definitely',
  seperate: 'separate', untill: 'until', wich: 'which', whcih: 'which', becuase: 'because', beacuse: 'because', becasue: 'because',
  thier: 'their', alot: 'a lot', tommorow: 'tomorrow', tomorow: 'tomorrow', tommorrow: 'tomorrow', occured: 'occurred',
  adress: 'address', begining: 'beginning', calender: 'calendar', comming: 'coming', completly: 'completely', freind: 'friend',
  freinds: 'friends', goverment: 'government', happend: 'happened', immediatly: 'immediately', knowlege: 'knowledge',
  lenght: 'length', libary: 'library', neccessary: 'necessary', necesary: 'necessary', noticable: 'noticeable', realy: 'really',
  recomend: 'recommend', relevent: 'relevant', rember: 'remember', remeber: 'remember', succesful: 'successful', sucessful: 'successful',
  suprise: 'surprise', truely: 'truly', wierd: 'weird', writting: 'writing', cousion: 'cousin', cusin: 'cousin', intership: 'internship',
  internhsip: 'internship', algorith: 'algorithm', algoritm: 'algorithm', alogrithm: 'algorithm', progam: 'program', programing: 'programming',
  langauge: 'language', lerning: 'learning', leanring: 'learning', excercise: 'exercise', exersice: 'exercise', protien: 'protein',
  calroies: 'calories', caloreis: 'calories', achived: 'achieved', acheive: 'achieve', acheived: 'achieved', aditional: 'additional',
  arguement: 'argument', basicly: 'basically', buisness: 'business', catagory: 'category', collegue: 'colleague', decison: 'decision',
  dissapoint: 'disappoint', enviroment: 'environment', existance: 'existence', independant: 'independent', occassion: 'occasion',
  posession: 'possession', prefered: 'preferred', publically: 'publicly', resturant: 'restaurant', tounge: 'tongue', wether: 'whether',
  dont: "don't", doesnt: "doesn't", didnt: "didn't", isnt: "isn't", wasnt: "wasn't", couldnt: "couldn't", shouldnt: "shouldn't",
  wouldnt: "wouldn't", havent: "haven't", hasnt: "hasn't", arent: "aren't", werent: "weren't", im: "I'm", ive: "I've",
  thats: "that's", whats: "what's", theres: "there's", youre: "you're", i: 'I', studing: 'studying', stuided: 'studied',
  undrestand: 'understand', understnad: 'understand', solveing: 'solving', compelte: 'complete', compleated: 'completed', finsihed: 'finished',
  finshed: 'finished', strated: 'started', srated: 'started', becaus: 'because', beause: 'because', proejct: 'project', porject: 'project',
  linkdin: 'LinkedIn', linkedln: 'LinkedIn', leetocde: 'LeetCode', githbu: 'GitHub', pyhton: 'Python', pytohn: 'Python', javascipt: 'JavaScript',
};

// Proper names -> always written with the right capitals in suggestions and fixes
export const PROPER: Record<string, string> = {
  leetcode: 'LeetCode', github: 'GitHub', linkedin: 'LinkedIn', python: 'Python', java: 'Java', javascript: 'JavaScript',
  typescript: 'TypeScript', react: 'React', html: 'HTML', css: 'CSS', sql: 'SQL', mysql: 'MySQL', api: 'API', dsa: 'DSA',
  vedantu: 'Vedantu', streamlit: 'Streamlit', pandas: 'pandas', numpy: 'NumPy', pune: 'Pune', jaipur: 'Jaipur', india: 'India',
  ascent: 'Ascent', aryan: 'Aryan', jain: 'Jain', i: 'I',
};
