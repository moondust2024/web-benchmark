function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}
  
loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', () => {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library is not loaded');
    } else {
        const supabaseUrl = 'https://skbwsugoaatergloenlq.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYndzdWdvYWF0ZXJnbG9lbmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzOTc0MjIsImV4cCI6MjA0Njk3MzQyMn0.fvMKNXkFPCvdjLZsQ3VHOfIog3uaW6mfJ5KuVoD-lKQ';
        const supabase = supabase.createClient(supabaseUrl, supabaseKey);

        async function saveScore() {
        const cpumodel = document.getElementById('model').value;
        const score = document.getElementById('floatscore').value;
        const scoretext = document.getElementById('score').value;

        const { data, error } = await supabase
            .from('CPURank')
            .insert(
            { id: 'id', cpumodel: cpumodel, score: parseFloat(score) , scoretext: scoretext }
            );

        if (error) {
            console.error('Error saving score:', error); 
        } else {
            console.log('Score saved:', data);
        }
        }
    }
});