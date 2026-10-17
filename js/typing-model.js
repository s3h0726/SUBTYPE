// Official names remain fully visible. All bracket glyphs are auto-filled;
// letters and digits INSIDE brackets are required, just like the main station name.
export function isAutoFilledSymbol(character){return !/[\p{L}\p{N}]/u.test(character)}
export function buildTypingModel(value=''){
  const displayText=String(value).normalize('NFC');
  const cells=Array.from(displayText,character=>({character,type:isAutoFilledSymbol(character)?'fixed':'input'}));
  const inputText=cells.filter(cell=>cell.type==='input').map(cell=>cell.character).join('');
  return{displayText,inputText,cells,inputLength:Array.from(inputText).length,
    fixedLength:cells.filter(cell=>cell.type==='fixed').length}
}
