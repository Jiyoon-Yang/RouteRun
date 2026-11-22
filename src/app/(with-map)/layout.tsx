import Script from 'next/script';

// vectorjs(1.5KB)는 SDK 스크립트·CSS를 document.write로 넣는다. 로드 뒤라 원래 write는 문서를 지우므로
// 그동안만 head에 붙이도록 가로챈다. 해제는 vectorjs 실행이 끝난 뒤(onload)에 한다 — 예전 5초 고정 한도는
// 느린 회선에서 vectorjs가 늦게 오면 SDK가 실행되지 않아 지도가 영영 안 떴다. SDK 본체는 document.write를 쓰지 않는다.
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
  var s=document.createElement('script');
  s.onload=s.onerror=function(){document.write=orig;};
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
