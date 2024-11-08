import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "processes", "toolings", "productsFit", "materialPieces", "materialPrice", "squareMeters"] 

  addProcess(event) {
    event.preventDefault();

    const selectElement = event.target.closest('.nested-fields').querySelector('select[name*="[manufacturing_process_id]"]'); 

    if (selectElement) { 
        const selectedOption = selectElement.selectedOptions[0];

        if (selectedOption) {
            const processDescription = selectedOption.text;
            const processPrice = parseFloat(selectedOption.dataset.price);
            const processUnit = selectedOption.dataset.unit;

            const materialPieces = parseFloat(document.getElementById('material-pieces').textContent);
            const squareMeters = parseFloat(document.getElementById('square-meters').textContent);

            let calculatedPrice = 0;
            if (processUnit === "pliego") {
              calculatedPrice = processPrice * materialPieces;
            } else if (processUnit === "m2") {
              calculatedPrice = processPrice * squareMeters;
            } else {
              console.error("Unknown process unit:", processUnit, calculatedPrice);
            }

            this.addProcessToList(processDescription, processPrice, processUnit, calculatedPrice);
        } else {
            console.error("No option selected in the manufacturing process select.");
        }
    } else {
        console.error("Select element for manufacturing process not found!");
    }
  }

  showProcessDetails(event) {
    const selectedOption = event.target.selectedOptions[0];
    const processPrice = parseFloat(selectedOption.dataset.price);
    const processUnit = selectedOption.dataset.unit;

    const nestedFieldsDiv = event.target.closest('.nested-fields'); 
    const processPriceDisplay = nestedFieldsDiv.querySelector('[data-quotes-target="processPrice"]');
    const processUnitDisplay = nestedFieldsDiv.querySelector('[data-quotes-target="processUnit"]');
  
    if (processPriceDisplay) {
      processPriceDisplay.textContent = `$${processPrice.toFixed(2)}`;
    }
  
    if (processUnitDisplay) {
      processUnitDisplay.textContent = processUnit;
    }
  }

  addTooling(event) {
    event.preventDefault();
    const selectElement = this.toolingsTarget.querySelector('select[name*="[tooling_id]"]');
    if (selectElement) {
      const toolingId = selectElement.value;  
      if (toolingId) {
        const toolingDescription = selectElement.options[selectElement.selectedIndex].text;
        this.addToolingToList(toolingDescription);
        selectElement.value = '';
      }
    } else {
      console.error("Select element for tooling not found!");
    }
  }

  calculateProducts(event) {
    event.preventDefault();

    const materialSelect = document.getElementById('quote_material_id');
    if (materialSelect) {
      const selectedOption = materialSelect.selectedOptions[0];

      if (selectedOption) {
        const materialWidth = parseFloat(selectedOption.getAttribute('data-width'));
        const materialLength = parseFloat(selectedOption.getAttribute('data-length'));
        const materialPrice = parseFloat(selectedOption.getAttribute('data-price'));

        const productQuantity = parseFloat(document.getElementById('quote_pieces').value);
        const productWidth = parseFloat(document.getElementById('quote_width').value);
        const productLength = parseFloat(document.getElementById('quote_length').value);

        if (isNaN(materialWidth) || isNaN(materialLength) || isNaN(productWidth) || isNaN(productLength)) {
          console.error("Invalid dimensions. Please check the input values and data attributes.");
          this.productsFitTarget.value = 0;
          return;
        }

        const productsInWidth = Math.floor(materialWidth / productWidth);
        const productsInLength = Math.floor(materialLength / productLength);
        const totalProducts = productsInWidth * productsInLength;
        document.getElementById('products-fit').textContent = totalProducts;

        const piecesNeeded = Math.ceil(productQuantity / totalProducts); 
        document.getElementById('material-pieces').textContent = piecesNeeded;

        const quoteValue = materialPrice * piecesNeeded;
        const formattedQuoteValue = quoteValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        document.getElementById('material-price').textContent = formattedQuoteValue; 

        const squareMeters = (materialLength * materialWidth * piecesNeeded) / 10000;
        document.getElementById('square-meters').textContent = squareMeters;

      } else {
        console.error("No material selected!");
      }
    } else {
      console.error("Material select element not found!");
    }
  }
  
  showMaterialPrice(event) {
    const selectedOption = event.target.selectedOptions[0];
    const materialPrice = parseFloat(selectedOption.getAttribute('data-price'));
    const materialUnit = selectedOption.getAttribute('data-unit');

    const materialPriceDisplay = document.getElementById('material_price_display');
    if (materialPriceDisplay) {
      materialPriceDisplay.textContent = `$${materialPrice.toFixed(2)}`;
    }

    const materialUnitDisplay = document.getElementById('material_unit_display');
    if (materialUnitDisplay) {
      materialUnitDisplay.textContent = materialUnit;
    }
  }

  showManufactureProcessInfo(event) {
    const selectedOption = event.target.selectedOptions[0];
    const manufacturingProcessPrice = parseFloat(selectedOption.getAttribute('data-price'));
    const manufacturingProcessUnit = selectedOption.getAttribute('data-unit');

    const manufacturingProcessPriceDisplay = document.getElementById('manufacturing_process_price_display');
    if (manufacturingProcessPriceDisplay) {
      manufacturingProcessPriceDisplay.textContent = `$${manufacturingProcessPrice.toFixed(2)}`;
    }

    const manufacturingProcessUnitDisplay = document.getElementById('manufacturing_process_unit_display');
    if (manufacturingProcessUnitDisplay) {
      manufacturingProcessUnitDisplay.textContent = manufacturingProcessUnit;
    }
  }

  createProcessField() {
    const newId = new Date().getTime(); 
    const regexp = new RegExp("new_quote_process", "g"); 
    const newProcessFields = this.processFieldsTemplate.replace(regexp, newId);
    return newProcessFields;
  }

  createToolingField() {
    const newId = new Date().getTime(); 
    const regexp = new RegExp("new_quote_tooling", "g"); 
    const newToolingFields = this.toolingFieldsTemplate.replace(regexp, newId);
    return newToolingFields;
  }

  addProcessToList(processDescription, processPrice, processUnit, calculatedPrice) {
    const newRow = document.createElement('tr'); 
    const descriptionCell = document.createElement('td');
    
    descriptionCell.textContent = processDescription;
    newRow.appendChild(descriptionCell);

    const priceCell = document.createElement('td');
    priceCell.textContent = calculatedPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
    priceCell.style.textAlign = 'right';
    newRow.appendChild(priceCell);

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Eliminar';
    removeButton.classList.add('btn', 'btn-danger');
    removeButton.addEventListener('click', () => {
      newRow.remove();
    });
    removeCell.appendChild(removeButton);
    newRow.appendChild(removeCell);

    this.processesTarget.querySelector('tbody').appendChild(newRow); 
  }

  addToolingToList(toolingDescription) {
    const listItem = document.createElement('li');
    listItem.textContent = toolingDescription;
    this.toolingsTarget.querySelector('ul').appendChild(listItem);
  }

  get processFieldsTemplate() {
    return `
      <div class="nested-fields">
        <div class="form-group">
          <label for="quote_quote_processes_attributes_new_quote_process_manufacturing_process_id">Proceso:</label>
          <select class="form-control" name="quote[quote_processes_attributes][new_quote_process][manufacturing_process_id]" id="quote_quote_processes_attributes_new_quote_process_manufacturing_process_id"
                  data-action="change->quotes#showProcessDetails"> 
            <option value="">Select one</option>
            <% ManufacturingProcess.all.each do |process| %>
              <option value="<%= process.id %>" 
                      data-price="<%= process.price %>" 
                      data-unit="<%= process.unit.description %>"> 
                <%= process.description %>
              </option>
            <% end %>
          </select>
        </div>
        <div class="input-group-append">
          <span class="input-group-text" data-quotes-target="processPrice">$0.00</span>
          <span class="input-group-text ml-1" data-quotes-target="processUnit"></span>
        </div>
      </div>
      <button type="button" class="btn btn-danger" data-action="click->quotes#removeField">Eliminar</button>
    `.trim();
  }

  get toolingFieldsTemplate() {
    return `
        <div class="nested-fields">
          <div class="form-group">
            <label for="quote_quote_toolings_attributes_new_quote_tooling_tooling_id">Herramental:</label>
            <select class="form-control" name="quote[quote_toolings_attributes][new_quote_tooling][tooling_id]" id="quote_quote_toolings_attributes_new_quote_tooling_tooling_id">
              <option value="">Select one</option>
              <% Tooling.all.each do |tooling| %>
                <option value="<%= tooling.id %>"><%= tooling.description %></option>
              <% end %>
            </select>
          </div>
          <button type="button" class="btn btn-danger" data-action="click->quotes#removeField">Eliminar</button>
        </div>
      </template>
    `.trim();
  }

  removeField(event) {
    event.preventDefault();
    const field = event.target.closest(".nested-fields");

    // Add the _destroy field
    const destroyField = document.createElement('input');
    destroyField.setAttribute('type', 'hidden');
    destroyField.setAttribute('name', this.getDestroyFieldName(event.target));
    destroyField.setAttribute('value', '1');
    field.appendChild(destroyField);

    // Hide the field instead of removing it immediately
    field.style.display = 'none'; 
  }

  getDestroyFieldName(target) {
    const fieldId = target.closest('div[id*=quote_quote_processes_attributes]').id || 
                    target.closest('div[id*=quote_quote_toolings_attributes]').id;
    if (fieldId) {
      return fieldId.replace(/quote_quote_processes_attributes_/, '') + '[_destroy]';
    } else {
      return ''; // Or handle the case where no fieldId is found
    }
  }

  calculateQuote(event) {
    event.preventDefault();

    if (this.processesTarget === null) {
      alert("Por favor, calcula los productos primero.");
      return;
    }
    
    const materialPrice = parseFloat(document.getElementById('material-price').textContent.replace(/[^0-9.-]+/g, "")); 

    let processPricesSum = 0;
    const processRows = this.processesTarget.querySelectorAll('tbody tr'); 
    processRows.forEach(row => {
      const priceCell = row.querySelector('td:nth-child(2)'); 
      const priceValue = parseFloat(priceCell.textContent.replace(/[^0-9.-]+/g, "")); 
      processPricesSum += priceValue;
    });

    const finalQuoteValue = materialPrice + processPricesSum;
    const formattedFinalQuoteValue = finalQuoteValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    document.getElementById('final-quote-value').textContent = formattedFinalQuoteValue;
  }
}