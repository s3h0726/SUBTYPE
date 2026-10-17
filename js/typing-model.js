// Display full official station names, but do not make parenthetical annotations
// part of the typing answer. This applies to ASCII and full-width parentheses.
const OPEN_TO_CLOSE=new Map([['(',')'],['（','）'],['[',']'],['［','］'],['【','】'],['〈','〉'],['《','》']]);
const CLOSE=new Set(OPEN_TO_CLOSE.values());
export function isAutoFilledSymbol(character){return !/[\p{L}\p{N}]/u.test(character)}
export function buildTypingModel(value=''){
  const displayText=String(value).normalize('NFC'),characters=Array.from(displayText),cells=[];
  // Only omit bracket contents if a usable name exists outside the parentheses.
  // Unmatched parentheses cannot swallow the rest of the name.
  const pairs=[],stack=[];
  for(let i=0;i<characters.length;i++){
    const ch=characters[i];
    if(OPEN_TO_CLOSE.has(ch))stack.push({index:i,open:ch});
    else if(CLOSE.has(ch)&&stack.length){
      const top=stack.at(-1);
      if(OPEN_TO_CLOSE.get(top.open)===ch){
        stack.pop();pairs.push([top.index,i]);
      }
    }
  }
  const annotationIndices=new Set();
  for(const [start,end] of pairs)for(let i=start;i<=end;i++)annotationIndices.add(i);
  const outside=characters.filter((ch,i)=>!annotationIndices.has(i)&&/[\p{L}\p{N}]/u.test(ch)).join('');
  const omitAnnotations=outside.length>0;
  for(let i=0;i<characters.length;i++){
    const character=characters[i],inAnnotation=omitAnnotations&&annotationIndices.has(i);
    cells.push({character,type:inAnnotation||isAutoFilledSymbol(character)?'fixed':'input'});
  }
  const inputText=cells.filter(cell=>cell.type==='input').map(cell=>cell.character).join('');
  return{displayText,inputText,cells,inputLength:Array.from(inputText).length,fixedLength:cells.filter(cell=>cell.type==='fixed').length};
}
