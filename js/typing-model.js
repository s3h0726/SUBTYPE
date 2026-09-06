const PARENTHESES=new Set(['(',')','（','）']);
export function isAutoFilledSymbol(character){return!PARENTHESES.has(character)&&!/[\p{L}\p{N}]/u.test(character)}
export function buildTypingModel(value=''){
  const displayText=String(value).normalize('NFC'),cells=Array.from(displayText,character=>({character,type:isAutoFilledSymbol(character)?'fixed':'input'})),inputText=cells.filter(cell=>cell.type==='input').map(cell=>cell.character).join('');
  return{displayText,inputText,cells,inputLength:Array.from(inputText).length,fixedLength:cells.filter(cell=>cell.type==='fixed').length}
}
