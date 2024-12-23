import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["processes", "toolings", "openIcon", "closeIcon", 
                   "productsFit", "materialPieces", "materialPrice", "squareMeters", "totalQuoteValue"]; 

  connect() {
    this.newProcessId = 0; 
    this.newToolingId = 0; 
  }

  calculateProducts(event) {
    event.preventDefault();
    
    const materialSelect = document.getElementById('quote_material_id');
    const priceInput = document.getElementById('material_price');

    const manualMaterial = document.getElementById('quote_manual_material').value;
    const manualMaterialPrice = parseFloat(document.getElementById('manual_material_price').value);
    const manualMaterialWidth = parseFloat(document.getElementById('quote_manual_material_width').value); 
    const manualMaterialLength = parseFloat(document.getElementById('quote_manual_material_length').value);   
    
    let materialWidth, materialLength, materialPrice;

    if (manualMaterial !== "") {
      materialWidth = manualMaterialWidth;
      materialLength = manualMaterialLength;
      materialPrice = manualMaterialPrice;
    } else {
      if (materialSelect) {
        const selectedOption = materialSelect.selectedOptions[0];
  
        if (selectedOption) {
          materialWidth = parseFloat(selectedOption.getAttribute('data-width'));
          materialLength = parseFloat(selectedOption.getAttribute('data-length'));
          materialPrice = parseFloat(priceInput.value);
        } else {
          console.error("No material selected!");
          return;
        }
      } else {
        console.error("Material select element not found!");
        return;
      }
    }
  
    const productQuantity = parseFloat(document.getElementById('quote_product_quantity').value) || 0;
    const productWidth = parseFloat(document.getElementById('quote_product_width').value) || 0;
    const productLength = parseFloat(document.getElementById('quote_product_length').value) || 0;

    const configMarginWidth = parseFloat(document.getElementById('config_margin_width').value) || 0;
    const configMarginLength = parseFloat(document.getElementById('config_margin_length').value) || 0;

    const finalProductWidth = productWidth + configMarginWidth;
    const finalProductLength = productLength + configMarginLength;

    // Check if product is too big for material
    if (finalProductWidth > materialWidth || finalProductLength > materialLength) {
      alert(`El producto es demasiado grande para el material seleccionado.
      \nTamaño del producto (con márgenes): ${finalProductWidth} x ${finalProductLength}
      \nTamaño del material: ${materialWidth} x ${materialLength}`);
      
      // Reset calculation fields
      document.getElementById('products-per-sheet').value = 0;
      document.getElementById('sheets-needed').value = 0;
      document.getElementById('material-total-price').value = 0;
      document.getElementById('material-square-meters').value = 0;
      return;
    }

    const productsInWidth = Math.floor(materialWidth / finalProductWidth);
    const productsInLength = Math.floor(materialLength / finalProductLength);
    const totalProducts = productsInWidth * productsInLength;
    
    if (totalProducts <= 0) {
      alert("No es posible calcular el número de productos por pliego. Verifique las dimensiones.");
      return;
    }

    document.getElementById('products-per-sheet').value = totalProducts;

    const sheetsNeeded = Math.ceil(productQuantity / totalProducts); 
    document.getElementById('sheets-needed').value = sheetsNeeded;

    const quoteValue = materialPrice * sheetsNeeded;
    document.getElementById('material-total-price').value = quoteValue.toFixed(2); 

    const squareMeters = (materialLength * materialWidth * sheetsNeeded) / 10000;
    document.getElementById('material-square-meters').value = squareMeters.toFixed(2);
  }

  reCalculateProducts(event) {
    event.preventDefault();

    try {  
      const materialSelect = document.getElementById('quote_material_id');
      const priceInput = document.getElementById('material_price').value;
      const productsPerSheetInput = document.getElementById('products-per-sheet').value; 
      const productQuantity = parseFloat(document.getElementById('quote_product_quantity').value);

      if (materialSelect && priceInput && productsPerSheetInput) {
        const selectedOption = materialSelect.selectedOptions[0];
        if (selectedOption) {
          const piecesNeeded = Math.ceil(productQuantity / productsPerSheetInput); 
          document.getElementById('sheets-needed').value = piecesNeeded;

          const materialPrice = parseFloat(piecesNeeded * priceInput);
          document.getElementById('material-total-price').value = materialPrice.toFixed(2);
      
          const materialWidth = parseFloat(selectedOption.getAttribute('data-width'));
          const materialLength = parseFloat(selectedOption.getAttribute('data-length'));
          const squareMeters = (materialLength * materialWidth * piecesNeeded) / 10000;
          document.getElementById('material-square-meters').value = squareMeters.toFixed(2);
        } else {
          console.error("No material option selected.");
        }
      } else {
        console.error("Missing elements: material select, price input, or products-fit field.");
      }
    } catch (error) {
      console.error("Error in reCalculateProducts:", error);
    }
  }

  addProcess(event) {
    event.preventDefault();

    const selectElement = document.getElementById('quote_manufacturing_process_id');
    const priceInput = document.getElementById('manufacturing_process_price_display');

    if (selectElement) { 
      const selectedOption = selectElement.selectedOptions[0];

      if (selectedOption) {        
        const processId = selectedOption.value;
        const processName = selectedOption.text.split(' - ')[0];
        const processDescription = selectedOption.text.split(' - ')[1];
        const processPrice = parseFloat(priceInput.value);
        const processUnit = selectedOption.getAttribute('data-unit');
            
        const materialPieces = parseFloat(document.getElementById('sheets-needed').value) || 0;
        const squareMeters = parseFloat(document.getElementById('material-square-meters').value) || 0;

        let calculatedPrice = 0;
        if (processUnit === "pliego") {
          calculatedPrice = processPrice * materialPieces;
        } else if (processUnit === "mt2" || processUnit === "m2") {
          calculatedPrice = processPrice * squareMeters;
        } else {
          console.error("Unknown process unit:", processUnit);
          return;
        }

        // Get the table body
        const tableBody = this.processesTarget.querySelector('tbody');

        // Create a new row for the process
        const newRow = document.createElement('tr');
        
        newRow.dataset.newProcess = "true";
        newRow.innerHTML = `
          <td>
            <span class="process-name">${processName}</span> - 
            <span class="process-description">${processDescription}</span>
          </td>
          <td class="text-center">
            <button type="button" data-action="click->quotes#removeProcess" class="btn btn-danger">Eliminar</button>
          </td>
          <td class="process-price-total text-right" data-price-id="${this.newProcessId}"> 
            ${calculatedPrice.toFixed(2)} 
          </td> 
        `;

        // Append the new row to the table body
        tableBody.appendChild(newRow);

        // Update the new process ID counter
        this.newProcessId++;

        this.updateProcessesSubtotal(); 

        // Clear selection
        selectElement.value = '';
        if (priceInput) priceInput.value = '';
        const unitDisplay = document.getElementById('manufacturing_process_unit_display');
        if (unitDisplay) unitDisplay.textContent = '';
      }
    }
  }

  updateProcessesSubtotal() {
    let subtotal = 0;
    const processRows = this.processesTarget.querySelectorAll('tbody tr');
    processRows.forEach(row => {
      const priceCell = row.querySelector('td:last-child');
      if (priceCell) {
        const priceValue = parseFloat(priceCell.textContent.replace(/[^0-9.-]+/g, ""));
        subtotal += priceValue;
      }
    });
  
    const subtotalSpan = document.getElementById('processes-subtotal');
    if (subtotalSpan) {
      subtotalSpan.textContent = subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
  }

  removeProcess(event) {
    event.preventDefault();

    const row = event.target.closest('tr'); 
    if (row) {
      row.remove();
      this.updateProcessesSubtotal();
    }
  }

  updateProcessesSubtotal() {
  let subtotal = 0;
  const priceSpans = this.processesTarget.querySelectorAll('.process-price-total'); 
  priceSpans.forEach(priceSpan => {
    subtotal += parseFloat(priceSpan.textContent); 
  });

  const subtotalSpan = document.getElementById('processes-subtotal');
  if (subtotalSpan) {
    subtotalSpan.textContent = subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
}

  createProcessField() {
    const newId = new Date().getTime(); 
    const regexp = new RegExp("new_quote_process", "g"); 
    const newProcessFields = this.processFieldsTemplate.replace(regexp, newId);
    return newProcessFields;
  }

  showManufactureProcessInfo(event) {    
    const selectedOption = event.target.selectedOptions[0];
    if (!selectedOption) return;

    // Get data attributes
    const price = selectedOption.getAttribute('data-price');
    const unit = selectedOption.getAttribute('data-unit');
    const unitId = selectedOption.getAttribute('data-unit-id');

    // Update display elements
    const priceInput = document.getElementById('manufacturing_process_price_display');
    const unitDisplay = document.getElementById('manufacturing_process_unit_display');

    if (priceInput) priceInput.value = price || '';
    if (unitDisplay) unitDisplay.textContent = unit || '';
  }

  addProcessToList(processDescription, processPrice, processUnit, calculatedPrice) {
    const newRow = document.createElement('tr'); 
    const descriptionCell = document.createElement('td');
    
    descriptionCell.textContent = processDescription;
    newRow.appendChild(descriptionCell);

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Eliminar';
    removeButton.classList.add('btn', 'btn-danger');
    removeButton.setAttribute('data-action', 'click->quotes#removeProcess');
    removeButton.addEventListener('click', (event) => {
      event.preventDefault();
      newRow.remove();
      this.updateProcessesSubtotal();
    });
    removeCell.appendChild(removeButton);
    removeCell.classList.add('text-center');
    newRow.appendChild(removeCell);

    const priceCell = document.createElement('td');
    priceCell.textContent = calculatedPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
    priceCell.style.textAlign = 'right';
    newRow.appendChild(priceCell);

    this.processesTarget.querySelector('tbody').appendChild(newRow); 
  }

  addTooling(event) {
    event.preventDefault();
  
    const selectElement = event.target.closest('.nested-fields').querySelector('select[name*="[tooling_id]"]');
    const priceInput = document.getElementById('tooling_price_display');
    const quantityInput = document.getElementById('quantity'); 
  
    if (selectElement && priceInput && quantityInput) {
      const selectedOption = selectElement.selectedOptions[0];
  
      if (selectedOption) {
        const toolingId = selectedOption.value;
        const toolingDescription = selectedOption.text;
        const toolingPrice = parseFloat(priceInput.value);
        const toolingQuantity = parseInt(quantityInput.value, 10); 
  
        const calculatedPrice = toolingPrice * toolingQuantity;
  
        // Get the table body
        const tableBody = this.toolingsTarget.querySelector('tbody'); // Assuming you have a "toolingsTarget"
  
        // Create a new row for the tooling
        const newRow = document.createElement('tr');
        newRow.dataset.newTooling = "true";
        newRow.innerHTML = `
          <td>
            <input type="hidden" name="quote[quote_toolings_attributes][${this.newToolingId}][tooling_id]" value="${toolingId}">
            <span class="tooling-description">${toolingDescription}</span>
            <input type="hidden" name="quote[quote_toolings_attributes][${this.newToolingId}][quantity]" value="${toolingQuantity}">
            <span class="tooling-quantity">(${toolingQuantity})</span>
          </td>
          <td class="text-center">
            <a href="#" data-action="click->quotes#removeTooling" class="btn btn-danger">Eliminar</a>
          </td>
          <td class="text-right">
            <span class="tooling-price-total">${calculatedPrice.toFixed(2)}</span>
          </td>
        `;
  
        // Append the new row to the table body
        tableBody.appendChild(newRow);
  
        // Update the new tooling ID counter
        this.newToolingId++;
  
        this.updateToolingsSubtotal();
      } else {
        console.error("No option selected in the tooling select.");
      }
    } else {
      console.error("Select element or price/quantity input for tooling not found!");
    }
  }

  updateToolingsSubtotal() {
    let subtotal = 0;
    const priceSpans = this.toolingsTarget.querySelectorAll('.tooling-price-total'); // Assuming you have a "toolingsTarget"
    priceSpans.forEach(priceSpan => {
      subtotal += parseFloat(priceSpan.textContent);
    });
  
    const subtotalSpan = document.getElementById('toolings-subtotal'); 
    if (subtotalSpan) {
      subtotalSpan.textContent = subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
  }

  removeTooling(event) {
    event.preventDefault();
  
    const row = event.target.closest('tr');
    if (row) {
      row.remove();
      this.updateToolingsSubtotal();
    }
  }
  
  showToolingDetails(event) {
    const selectedOption = event.target.selectedOptions[0];
    const toolingPrice = parseFloat(selectedOption.dataset.price);
    const toolingUnit = selectedOption.dataset.unit;

    const nestedFieldsDiv = event.target.closest('.nested-fields'); 
    const toolingPriceDisplay = nestedFieldsDiv.querySelector('[data-quotes-target="toolingPrice"]');
    const toolingUnitDisplay = nestedFieldsDiv.querySelector('[data-quotes-target="toolingUnit"]');
  
    if (toolingPriceDisplay) {
      toolingPriceDisplay.textContent = `$${toolingPrice.toFixed(2)}`;
    }
  
    if (toolingUnitDisplay) {
      toolingUnitDisplay.textContent = toolingUnit;
    }
  }

  showToolingInfo(event) {
    const selectElement = event.target; 
    const priceDisplay = selectElement.parentNode.querySelector('input[type="number"]');
    const price = selectElement.options[selectElement.selectedIndex].dataset.price;
    const unit = selectElement.options[selectElement.selectedIndex].dataset.unit;
  
    if (priceDisplay) {
      priceDisplay.value = parseFloat(price).toFixed(2);
    } else {
      console.error("Price display element not found for tooling.");
    }
    
    // The following lines should be inside the if(priceDisplay) block
    const toolingPriceDisplay = document.getElementById('tooling_price_display'); 
    if (toolingPriceDisplay) {
      toolingPriceDisplay.textContent = `$${parseFloat(price).toFixed(2)}`; // Use price here
    }
  
    const toolingUnitDisplay = document.getElementById('tooling_unit_display');
    if (toolingUnitDisplay) {
      toolingUnitDisplay.textContent = unit; 
    }
  }

  createToolingField() {
    const newId = new Date().getTime(); 
    const regexp = new RegExp("new_quote_tooling", "g"); 
    const newToolingFields = this.toolingFieldsTemplate.replace(regexp, newId);
    return newToolingFields;
  }

  addToolingToList(toolingDescription, toolingPrice, toolingUnit, calculatedPrice) {
    const newRow = document.createElement('tr'); 
    const descriptionCell = document.createElement('td');
    
    descriptionCell.textContent = toolingDescription;
    newRow.appendChild(descriptionCell);

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Eliminar';
    removeButton.classList.add('btn', 'btn-danger');
    removeButton.setAttribute('data-action', 'click->quotes#removeTooling');
    removeButton.addEventListener('click', (event) => {
      event.preventDefault(); 
      newRow.remove();
      this.updateToolingsSubtotal();
    });
    removeCell.appendChild(removeButton);
    removeCell.classList.add('text-center');
    newRow.appendChild(removeCell);

    const priceCell = document.createElement('td');
    priceCell.textContent = calculatedPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
    priceCell.style.textAlign = 'right';
    newRow.appendChild(priceCell);

    this.toolingsTarget.querySelector('tbody').appendChild(newRow); 
  }

  showMaterialPrice(event) {
    const selectedOption = event.target.selectedOptions[0];
    
    if (!selectedOption) {
      console.log("No option selected");
      return;
    }

    // Get elements
    const priceInput = document.getElementById('material_price');
    const unitDisplay = document.getElementById('material_unit_display');
    const unitIdInput = document.getElementById('quote_material_unit_id');
    const materialWidthInput = document.getElementById('material_width');
    const materialLengthInput = document.getElementById('material_length');

    // Update values
    if (priceInput) priceInput.value = selectedOption.getAttribute('data-price') || '';
    if (unitDisplay) unitDisplay.textContent = selectedOption.getAttribute('data-unit') || '';
    if (unitIdInput) unitIdInput.value = selectedOption.getAttribute('data-unit-id') || '';
    if (materialWidthInput) materialWidthInput.value = selectedOption.getAttribute('data-width') || '';
    if (materialLengthInput) materialLengthInput.value = selectedOption.getAttribute('data-length') || '';
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
          <select class="form-control" name="quote[quote_toolings_attributes][new_quote_tooling][tooling_id]" id="quote_quote_toolings_attributes_new_quote_tooling_tooling_id"
                  data-action="change->quotes#showToolingDetails"> <%# Add data-action %>
            <option value="">Select one</option>
            <% Tooling.all.each do |tooling| %>
              <option value="<%= tooling.id %>" data-price="<%= tooling.price %>" data-unit="<%= tooling.unit.description %>"> <%# Add data attributes %>
                <%= tooling.description %> 
              </option>
            <% end %>
          </select>
        </div>
        <div class="input-group-append">
          <span class="input-group-text" data-quotes-target="toolingPrice">$0.00</span> <%# Add price display %>
          <span class="input-group-text ml-1" data-quotes-target="toolingUnit"></span> <%# Add unit display %>
        </div>
        <button type="button" class="btn btn-danger" data-action="click->quotes#removeField">Eliminar</button>
      </div>
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

  updateWasteValue(event) {
    const wastePercentage = parseFloat(event.target.value);
    const subTotal = parseFloat(document.getElementById('sub-total-value').value);
  
    if (!isNaN(wastePercentage) && !isNaN(subTotal)) {
      const wasteValue = (wastePercentage / 100) * subTotal;
      document.getElementById('quote_waste_value').value = wasteValue.toFixed(2);
      this.calculateQuote();
    }
  }
  
  updateMarginValue(event) {
    const marginPercentage = parseFloat(event.target.value);
    const subTotal = parseFloat(document.getElementById('sub-total-value').value);
  
    if (!isNaN(marginPercentage) && !isNaN(subTotal)) {
      const marginValue = (marginPercentage / 100) * subTotal;
      document.getElementById('quote_margin_value').value = marginValue.toFixed(2);
      this.calculateQuote(); // Recalculate the quote
    }
  }
  
  calculateQuote(event) {
    event.preventDefault();

    // Get base values
    const materialPrice = parseFloat(document.getElementById('material-total-price').value) || 0;
    const processesSubtotal = parseFloat(document.getElementById('processes-subtotal').textContent.replace(/[^0-9.-]+/g, "")) || 0;
    const toolingsSubtotal = parseFloat(document.getElementById('toolings-subtotal').textContent.replace(/[^0-9.-]+/g, "")) || 0;

    // Calculate subtotal
    const subtotal = materialPrice + processesSubtotal + toolingsSubtotal;
    document.getElementById('quote_subtotal').value = subtotal.toFixed(2);

    // Get waste and margin percentages directly from the input fields
    const wastePercentage = parseFloat(document.getElementById('waste').value) || 0;
    const marginPercentage = parseFloat(document.getElementById('margin').value) || 0;

    // Calculate waste amount
    const wasteAmount = subtotal * (wastePercentage / 100);
    document.getElementById('quote_waste_price').value = wasteAmount.toFixed(2);

    // Calculate margin amount
    const marginAmount = subtotal * (marginPercentage / 100);
    document.getElementById('quote_margin_price').value = marginAmount.toFixed(2);

    // Calculate total
    const totalValue = subtotal + wasteAmount + marginAmount;
    document.getElementById('total-quote-value').value = totalValue.toFixed(2);

    // Calculate price per piece
    const productPieces = parseFloat(document.getElementById('quote_product_quantity').value) || 0;
    if (productPieces > 0) {
      const pricePerPiece = totalValue / productPieces;
      document.getElementById('price-per-piece').value = pricePerPiece.toFixed(2);
    }
  }

  searchCustomer(event) {
    event.preventDefault();

    const customerName = document.getElementById('quote_customer_name').value;
    const organizationField = document.getElementById('quote_customer_organization');
    const emailField = document.getElementById('quote_customer_email');

    // Create or get the select element
    let organizationSelect = document.getElementById('organization_select');
    if (!organizationSelect) {
      organizationSelect = document.createElement('select');
      organizationSelect.id = 'organization_select';
      organizationSelect.className = 'form-control';
      organizationField.parentNode.insertBefore(organizationSelect, organizationField);
      organizationField.style.display = 'none';
    }

    // Store the results globally to access them when selection changes
    this.searchResults = [];

    fetch('/quotes/search_customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      },
      body: JSON.stringify({
        quote: {
          customer_name: customerName
        }
      })
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data.results && data.results.length > 0) {
        this.searchResults = data.results;
        
        // Clear and populate the select
        organizationSelect.innerHTML = '<option value="">Seleccione una organización</option>';
        
        data.results.forEach((result, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `${result.name} - ${result.organization || 'Sin organización'}`;
          organizationSelect.appendChild(option);
        });

        // Add change event listener
        organizationSelect.onchange = (e) => {
          const selectedResult = this.searchResults[e.target.value];
          if (selectedResult) {
            organizationField.value = selectedResult.organization || '';
            emailField.value = selectedResult.email || '';
          }
        };

      } else {
        alert('No se encontraron resultados en Pipedrive');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al buscar en Pipedrive. Por favor intente nuevamente.');
    });
  }

  clearCustomerInfo() {
    const customerInfoDiv = document.getElementById('customer_info'); 
    if (customerInfoDiv) {
      customerInfoDiv.innerHTML = '';
    }
  }

  updateManualMaterialUnit(event) {
    const selectedOption = event.target.selectedOptions[0];
    const manualMaterialUnitId = selectedOption.value;
  
    const unitIdField = document.getElementById('quote_manual_material_unit_id');
    if (unitIdField) {
      unitIdField.value = manualMaterialUnitId;
    }

  }

  updateHiddenField(event) {
    const hiddenField = document.getElementById('products-per-sheet-hidden');
    hiddenField.value = event.target.value;
  }
  
}