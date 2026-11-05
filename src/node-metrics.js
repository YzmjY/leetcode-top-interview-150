// Measure the text that the renderer actually shows. A shared estimate keeps
// layout spacing and edge endpoints aligned with the complete node label.
export function nodeMetrics(node={}){
  const source=Array.isArray(node.labelLines)&&node.labelLines.length?node.labelLines:[node.label??node.id??''];
  const lines=source.flatMap(line=>String(line).split(/\r?\n/));
  const textWidth=Math.max(0,...lines.map(line=>Array.from(line).reduce((width,char)=>width+(char.codePointAt(0)<=0x7f?8.5:14),0)));
  const caption=Boolean(node.caption);
  return {
    width:Math.max(46,Math.ceil(textWidth+20)),
    height:caption?28:Math.max(46,lines.length*18+20),
    lines,
    caption,
  };
}
