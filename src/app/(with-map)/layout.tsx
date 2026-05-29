import Script from 'next/script';

const tmapLoaderScript = `(function(){
  var orig=document.write.bind(document);
  document.write=function(markup){
    var div=document.createElement('div');
    div.innerHTML=markup;
    Array.prototype.forEach.call(div.children,function(node){
      if(node.tagName==='SCRIPT'){
        var s=document.createElement('script');
        var src=node.getAttribute('src');
        if(src){s.src=src;}else{s.textContent=node.textContent;}
        document.head.appendChild(s);
      }else{
        document.head.appendChild(node.cloneNode(true));
      }
    });
  };
  setTimeout(function(){document.write=orig;},5000);
  var s=document.createElement('script');
  s.src='https://apis.openapi.sk.com/tmap/vectorjs?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_API_KEY}';
  document.head.appendChild(s);
})();`;

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://apis.openapi.sk.com" />
      <link rel="preconnect" href="https://toptmaptile3.tmap.co.kr" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://apis.openapi.sk.com" />
      <link rel="dns-prefetch" href="https://toptmaptile3.tmap.co.kr" />
      <Script
        id="tmap-sdk-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: tmapLoaderScript }}
      />
      {children}
    </>
  );
}
