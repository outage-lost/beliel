(() => {
  const dialogues = [
    'Hola.',
    'Feliz cumpleaños. Espero que este sea un muy buen día para ti. Espero que estés rodeada de todas las personas que te quieren y que te aman. De verdad deseo que esta nueva etapa de tu vida esté llena de cosas bonitas.',
    'También espero que te hayan gustado los girasoles. Te deseo lo mejor.',
    'Y, si me permites pedirte una última cosa, no sigas leyendo lo que viene a continuación si crees que esto puede incomodarte o molestarte. Prefiero que cierres esta página aquí y no veas los siguientes diálogos.',
    'No sé si llegarás a ver esto. La verdad construí todo esto porque estaba anotado en mi agenda como un proyecto pendiente. Decidí terminarlo porque todavía tenía sentido crear algo que pudiera recibir alguien importante.',
    'Quería disculparme por todo lo que pasó. Por todo lo que hice, por todo lo que dije y por todas las veces que te fallé.',
    'Si te soy sincero, no recuerdo casi nada de los últimos meses, pero creo que está bien así. Estoy agotado. Muy agotado.',
    'No sé qué pienses de mí ahora. No sé cómo estén las cosas en tu vida. Solo quería dejar esto dicho. Quiero pedirte perdón. De verdad.',
    'No sé por qué hice todo eso si nunca antes me había atrevido. Con el tiempo entendí que gran parte de eso fue un grito desesperado y también el reflejo del enojo que llevaba dentro.',
    'La verdad, todavía me da una vergüenza tremenda recordar muchas de esas cosas. Pero no se puede cambiar lo que uno hace. Solo queda aprender a vivir con ello.',
    'Yo siempre fui consciente de que gran parte de lo que pasó fue culpa mía. Sabía que necesitabas que estuviera más presente, que te escuchara más y que te dedicara más tiempo.',
    'Pero seguí creyendo que primero debía terminar todo lo que estaba construyendo y que después tendría tiempo para arreglar las cosas.',
    'Pensé que el tiempo me iba a esperar. Y no fue así. Cuando quise reaccionar, ya era demasiado tarde.',
    'Me arrepiento de no haber tenido el valor de decir lo que sentía cuando todavía podía hacerlo. Me arrepiento de haber pensado que siempre habría otro día.',
    'Nunca llegó ese otro día.',
    'Durante mucho tiempo estuve tan concentrado en intentar construir un futuro que terminé destruyendo una parte importante del presente.',
    'Y en ese intento terminé descuidando precisamente a la persona con la que imaginaba compartirlo.',
    'Eso es algo que voy a cargar siempre.',
    'Hoy agradezco que ya no tengas que cargar con nada de lo que fueron mis decisiones. No te lo merecías.',
    'Esto no lo escribo esperando una respuesta, un perdón o una oportunidad. Tampoco espero cambiar nada.',
    'Solo quería terminar este proyecto y dejar este último mensaje.',
    'La verdad ya ni siquiera sé qué día es hoy. Estoy demasiado cansado y muy perdido últimamente.',
    'Pero bueno...',
    'Creo que ya hablé demasiado.',
    'Feliz cumpleaños.',
    'Espero que la vida te trate muy bien, que consigas todo lo que te propongas y que seas muy feliz.',
    'Quiero que sepas que siempre estuve y siempre estaré orgulloso de ti. Por eso sigo trabajando tanto, aunque ya no estés.',
    'Adiós para siempre.'
  ];
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).reduce((result,part)=>{result[part.type]=part.value;return result;},{});
  const available = `${parts.year}-${parts.month}-${parts.day}` === '2026-08-06';
  if (available) {
    document.getElementById('special-title').innerHTML = 'La experiencia<br><em>está lista.</em>';
    document.getElementById('special-copy').textContent = 'Esta carta solo está disponible durante el 6 de agosto.';
    const view=document.getElementById('dialogue-view');const text=document.getElementById('dialogue-text');const count=document.getElementById('dialogue-count');const next=document.getElementById('dialogue-next');let index=0;
    view.classList.remove('is-hidden');
    const render=()=>{text.textContent=dialogues[index];count.textContent=`${index+1} / ${dialogues.length}`;next.textContent=index===dialogues.length-1?'Terminar':'Continuar';};
    next.addEventListener('click',()=>{if(index<dialogues.length-1){index+=1;render();}else{view.classList.add('is-hidden');}});render();
  }
})();
