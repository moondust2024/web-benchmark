document.addEventListener('DOMContentLoaded', function() {
    fetch('cpu.json')
      .then(response => response.json())
      .then(data => {
        const cpus = data.CPUs;
        const sortedCpus = cpus.slice().reverse();
        populateModels(sortedCpus);
      })
      .catch(error => {
        console.error('Error fetching the JSON file:', error);
      });
  
    function populateModels(models) {
      const modelSelect = document.getElementById('model');
      modelSelect.innerHTML = '<option value="Others">Please select a model</option>';
      models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
    }
  });