const schoolVocabulary = new Set(`
  a about above after again against all am an and any are as at be because been before being below between both
  but by can could did do does doing down during each few for from further had has have having he her here hers
  herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once
  only or other our ours ourselves out over own same she should so some such than that the their theirs them
  themselves then there these they this those through to too under until up very was we were what when where which
  while who whom why will with would you your yours yourself yourselves thank thanks hello hey hi welcome
  about account accountancy accounting admission admissions adviser adviser assistant assignment attendance
  applicant application approval are article assessment assistant affairs athletic audit basic balance bank beed
  bsa bsba bscs bsed bshm bspt bsn bscrim building bullying bus business cashier campus can canteen card career
  certificate chair change chat check clinic club clubs college course classroom classmate classes class
  computer concern contact counseling counselling counselor course credit curriculum dean degree department
  diploma document dormitory education elementary email emergency enrollment enrolment enroll enrol exam exams
  faculty fee fees final finance form freshman guidance grade grades graduation gym harassment health help history
  homework hours id identification incomplete information information technology internet issue jhs jupiter jhs
  laboratory law learn learning library located location lost maintenance management map medical medicine message
  morong nursing office online osa payment people physical policy professor program principal problem process
  registration registrar report request requirement requirements research room schedule school science semester
  service services shs student students study subject subjects support surgery teacher technical thesis ticket time
  transcript transferee transfer tuition university uniform user vacation vehicle wifi window workshop where which
  worksheet writing year
  accomodation academic accounts activities administrator amount announcement application appointment archive
  availability available borrow borrowing break calendar cashier certificate chatbot classmate clearance complaint
  completion contact details enrollment enrollment fees financial first floor general information laboratory
  maintenance mispelled misspelled payment person phone point procedures records replacement result scholarship
  security semester staff status studentaffairs timetable transcript transportation treatment university verification
  wednesday thursday friday monday saturday sunday today tomorrow yesterday
  address applicant enrollment enrolment guidance registrar maintenance library accounting cashier financial assistance
`.trim().split(/\s+/));
const vocabularyByLength = new Map();
schoolVocabulary.forEach((word) => {
  const candidates = vocabularyByLength.get(word.length) || [];
  candidates.push(word);
  vocabularyByLength.set(word.length, candidates);
});
const wordCorrectionCache = new Map();

const editDistance = (first, second) => {
  const matrix = Array.from({ length: first.length + 1 }, (_, row) => (
    Array.from({ length: second.length + 1 }, (_, column) => row === 0 ? column : column === 0 ? row : 0)
  ));

  for (let row = 1; row <= first.length; row += 1) {
    for (let column = 1; column <= second.length; column += 1) {
      const substitutionCost = first[row - 1] === second[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost
      );
      if (row > 1 && column > 1
        && first[row - 1] === second[column - 2]
        && first[row - 2] === second[column - 1]) {
        matrix[row][column] = Math.min(matrix[row][column], matrix[row - 2][column - 2] + 1);
      }
    }
  }

  return matrix[first.length][second.length];
};

const correctKnownWord = (word) => {
  if (schoolVocabulary.has(word) || word.length < 4 || /^\d+$/.test(word)) return word;
  if (wordCorrectionCache.has(word)) return wordCorrectionCache.get(word);

  const maxDistance = word.length >= 9 ? 2 : 1;
  let closestDistance = maxDistance + 1;
  let closestWords = [];
  for (let length = word.length - maxDistance; length <= word.length + maxDistance; length += 1) {
    (vocabularyByLength.get(length) || []).forEach((candidate) => {
      const distance = editDistance(word, candidate);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestWords = [candidate];
      } else if (distance === closestDistance) {
        closestWords.push(candidate);
      }
    });
  }

  const corrected = closestDistance <= maxDistance && closestWords.length === 1 ? closestWords[0] : word;
  wordCorrectionCache.set(word, corrected);
  return corrected;
};

const normalizeStudentQuery = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b(?:u)\b/g, 'you')
  .replace(/\b(?:ur)\b/g, 'your')
  .replace(/\b(?:pls|plz)\b/g, 'please')
  .replace(/\bthx\b/g, 'thanks')
  .replace(/\b(?:ere|wher|whr|whre)\b/g, 'where')
  .replace(/\binrol(?:ment)?\b/g, 'enrollment')
  .split(' ')
  .map(correctKnownWord)
  .join(' ')
  .replace(/\s+/g, ' ')
  .trim();

module.exports = normalizeStudentQuery;