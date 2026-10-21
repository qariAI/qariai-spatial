// Fixed logical selections only. No Unicode normalization or arbitrary glyph URLs.
export const PRACTICES={
 kaf:{id:'kaf',letter:'ك',name:'Kāf',label:'kāf',index:0,features:'the body and detached component',description:'including the detached inner component'},
 lam:{id:'lam',letter:'ل',name:'Lām',label:'lām',index:1,features:'the source form',description:'with every original curve retained'},
 fa:{id:'fa',letter:'ف',name:'Fāʾ',label:'fāʾ',index:2,features:'the body, dot and enclosed counter',description:'including the original dot and enclosed counter'},
 ya:{id:'ya',letter:'ي',name:'Yāʾ',label:'yāʾ',index:3,features:'the body and dot pair',description:'including both original dots in their shared source contour'},
} as const;
export type PracticeId=keyof typeof PRACTICES;
export function practiceForLetter(letter:string|null|undefined){return Object.values(PRACTICES).find(p=>p.letter===letter)??null;}
