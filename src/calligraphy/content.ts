// Verbatim Uthmani text checked against Quran.com / Quran Foundation,
// 2026-10-13. Word spans are inclusive; punctuation and diacritics are retained.
// Never normalize, reverse, split, or decorate these strings with extra marks.
export const EXCERPTS = [
  { surah: 36, ayah: 38, words: [1, 8], theme: 'celestial motion', text: 'وَٱلشَّمۡسُ تَجۡرِي لِمُسۡتَقَرّٖ لَّهَاۚ ذَٰلِكَ تَقۡدِيرُ ٱلۡعَزِيزِ ٱلۡعَلِيمِ' },
  { surah: 39, ayah: 5, words: [1, 8], theme: 'creation and night', text: 'خَلَقَ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضَ بِٱلۡحَقِّۖ يُكَوِّرُ ٱلَّيۡلَ عَلَى ٱلنَّهَارِ' },
  { surah: 24, ayah: 35, words: [1, 9], theme: 'light', text: 'ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضِۚ مَثَلُ نُورِهِۦ كَمِشۡكَوٰةٖ فِيهَا مِصۡبَاحٌۖ' },
  { surah: 51, ayah: 47, words: [1, 5], theme: 'creation', text: 'وَٱلسَّمَآءَ بَنَيۡنَٰهَا بِأَيۡيْدٖ وَإِنَّا لَمُوسِعُونَ' },
  { surah: 55, ayah: 5, words: [1, 3], theme: 'celestial order', text: 'ٱلشَّمۡسُ وَٱلۡقَمَرُ بِحُسۡبَانٖ' },
  { surah: 21, ayah: 33, words: [8, 11], theme: 'celestial motion', text: 'كُلّٞ فِي فَلَكٖ يَسۡبَحُونَ' },
  { surah: 96, ayah: 4, words: [1, 3], theme: 'knowledge', text: 'ٱلَّذِي عَلَّمَ بِٱلۡقَلَمِ' },
  { surah: 24, ayah: 35, words: [33, 35], theme: 'light', text: 'نُّورٌ عَلَىٰ نُورٖۚ' },
].map(excerpt => ({ ...excerpt, source: `https://quran.com/${excerpt.surah}/${excerpt.ayah}` }));
