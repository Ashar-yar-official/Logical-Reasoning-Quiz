export type Question = {
  id: number;
  text: string;
  type: 'logic' | 'pattern';
  options: string[];
  correctAnswerIndex: number;
};

const namesSets = [
  ["Alice", "Bob", "Charlie", "Diana"],
  ["X", "Y", "Z", "W"],
  ["The Red Team", "The Blue Team", "The Green Team", "The Yellow Team"],
  ["Jupiter", "Saturn", "Mars", "Venus"],
  ["Alpha", "Beta", "Gamma", "Delta"]
];

const alienSets = [
  ["Zorps", "Blorps", "Gloops"],
  ["Flibs", "Globs", "Snarfs"],
  ["Quarks", "Leptons", "Bosons"],
  ["Spades", "Clubs", "Diamonds"],
  ["Widgets", "Gadgets", "Gizmos"]
];

function generateNumberOptions(correctNum: number): string[] {
  const options = [correctNum.toString()];
  let attempts = 0;
  while (options.length < 4 && attempts < 50) {
    const offsetOptions = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10, 20];
    const offset = offsetOptions[Math.floor(Math.random() * offsetOptions.length)];
    const falseVal = (correctNum + offset).toString();
    if (!options.includes(falseVal)) options.push(falseVal);
    attempts++;
  }
  
  // Failsafe if not enough unique offsets generated
  let backupOffset = 1;
  while (options.length < 4) {
    const val = (correctNum + backupOffset * 100).toString();
    if (!options.includes(val)) options.push(val);
    backupOffset++;
  }
  
  return options;
}

export function generateQuiz(count: number): Question[] {
  const questions: Question[] = [];
  
  for (let i = 1; i <= count; i++) {
    const typeRoll = Math.random();
    
    if (typeRoll < 0.25) {
      // Arithmetic sequence
      const start = Math.floor(Math.random() * 40) - 10;
      const step = Math.floor(Math.random() * 15) + 2;
      const n = 5;
      const seq = Array.from({length: n}, (_, idx) => start + idx * step);
      const correct = start + n * step;
      
      const options = generateNumberOptions(correct);
      options.sort(() => Math.random() - 0.5);
      
      questions.push({
        id: i,
        text: `What comes next in the sequence: ${seq.join(", ")}, ?`,
        type: 'pattern',
        options,
        correctAnswerIndex: options.indexOf(correct.toString())
      });
    } else if (typeRoll < 0.5) {
      // Geometric / Custom Sequence
      const seqType = Math.random();
      let seq, correct;
      
      if (seqType < 0.5) {
        // Geometric
        const start = Math.floor(Math.random() * 5) + 1;
        const factor = Math.floor(Math.random() * 3) + 2;
        const n = 4;
        seq = Array.from({length: n}, (_, idx) => start * Math.pow(factor, idx));
        correct = start * Math.pow(factor, n);
      } else {
        // Alternating (+a, -b)
        let current = Math.floor(Math.random() * 20) + 10;
        const add = Math.floor(Math.random() * 10) + 5;
        const sub = Math.floor(Math.random() * 5) + 1;
        seq = [];
        for(let j=0; j<5; j++) {
            seq.push(current);
            if (j % 2 === 0) current += add;
            else current -= sub;
        }
        correct = current;
      }
      
      const options = generateNumberOptions(correct);
      options.sort(() => Math.random() - 0.5);
      
      questions.push({
        id: i,
        text: `Identify the next number in the pattern: ${seq.join(", ")}, ?`,
        type: 'pattern',
        options,
        correctAnswerIndex: options.indexOf(correct.toString())
      });
    } else if (typeRoll < 0.75) {
      // Logic: Syllogism
      const t = alienSets[Math.floor(Math.random() * alienSets.length)];
      
      const text = `If all ${t[0]} are ${t[1]}, and all ${t[1]} are ${t[2]}, which statement must be true?`;
      const correct = `All ${t[0]} are ${t[2]}`;
      const wrong = [
        `All ${t[2]} are ${t[0]}`,
        `Some ${t[0]} are not ${t[2]}`,
        `No ${t[0]} are ${t[2]}`,
        `All ${t[1]} are ${t[0]}`
      ];
      
      wrong.sort(() => Math.random() - 0.5);
      const allOptions = [correct, ...wrong.slice(0, 3)].sort(() => Math.random() - 0.5);
      
      questions.push({
        id: i,
        text,
        type: 'logic',
        options: allOptions,
        correctAnswerIndex: allOptions.indexOf(correct)
      });
    } else {
      // Logic: Ordering
      const n = namesSets[Math.floor(Math.random() * namesSets.length)];
      
      const logicType = Math.random();
      let text, correct;
      const allOptions: string[] = [];
      
      if (logicType < 0.5) {
        text = `${n[0]} is faster than ${n[1]}. ${n[1]} is faster than ${n[2]}. Who is the slowest?`;
        correct = n[2];
        allOptions.push(n[0], n[1], n[2], "Cannot be determined");
      } else {
        text = `${n[0]} has more points than ${n[1]}. ${n[2]} has fewer points than ${n[1]}. Who has the most points?`;
        correct = n[0];
        allOptions.push(n[0], n[1], n[2], "Cannot be determined");
      }
      
      allOptions.sort(() => Math.random() - 0.5);
      
      questions.push({
        id: i,
        text,
        type: 'logic',
        options: allOptions,
        correctAnswerIndex: allOptions.indexOf(correct)
      });
    }
  }
  return questions;
}

// Generate 120 questions dynamically
export const QUESTIONS = generateQuiz(120);
