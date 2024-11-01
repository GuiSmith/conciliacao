var real = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
})

var ofx_selected = false;

function parseOFX(ofxContent) {
    // Remover cabeçalhos desnecessários, caso existam, para converter em XML válido
    const xmlContent = ofxContent.replace(/^[^<].*$/gm, '').trim();

    // Parsear como XML usando DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Verificar por erros de parsing
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        console.log(xmlDoc);
        console.log("Erro ao parsear o OFX");
        return;
    }
    // Navegar pelos dados do XML
    const transactions = xmlDoc.getElementsByTagName('STMTTRN');
    const transactionData = [];
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        transactionData.push({
            id: transaction.getElementsByTagName('FITID')[0].textContent,
            type: transaction.getElementsByTagName('TRNTYPE')[0].textContent == 'DEBIT' ? 'Débito' : 'Crédito',
            date: formatDate(transaction.getElementsByTagName('DTPOSTED')[0].textContent),
            amount: real.format(transaction.getElementsByTagName('TRNAMT')[0].textContent),
            memo: transaction.getElementsByTagName('MEMO')[0]?.textContent || '',
        });
    }
    console.log(transactionData);
    let table_container = document.getElementById('ofx-table');
    let headers = ['ID', 'Tipo', 'Data', 'Valor', 'Descrição'];
    //Checks if a file is already selected and confirms the overwrite operation with the user
    let generate_table;
    //Is there an ofx file selected?
    if (ofx_selected) {
        generate_table = confirm("Tem certeza de que deseja carregar outro OFX? O atual não será salvo");
    } else {
        generate_table = true;
    }
    if (generate_table) {
        table_container.appendChild(createTable(transactionData, headers));
        ofx_selected = true;
    }
}

function createTable(data_obj, headers_array = [], filters = true) {
    // Check if data_obj is valid and not empty
    if (!data_obj || data_obj.length === 0) {
        console.error("No data provided or empty array.");
        return;
    }

    // Create table elements
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    //Keys
    const table_keys = Object.keys(data_obj[0]);

    // Create header row
    const headers = (!headers_array || Object.keys(headers_array) == 0) ? table_keys : headers_array;
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    //Filters
    if (filters) {
        let tr = document.createElement("tr");
        table_keys.forEach((key) => {
            let td = document.createElement('td');
            td.innerHTML = `
                <select class = "form-control" id="filter-${key}" name="filter-${key}">
                    <option class = "form-control" value="" selected>Selecionar...</option>
                </select>
            `;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }

    // Create body rows
    data_obj.forEach(row => {
        const tr = document.createElement('tr');
        table_keys.forEach(key => {
            const td = document.createElement('td');
            td.textContent = row[key];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    //Table headers class for bootstrap
    thead.classList.add("thead-dark");

    // Assemble the table
    table.appendChild(thead);
    table.appendChild(tbody);

    //Table classes for bootstrap
    table.classList.add("table");
    table.classList.add("table-bordered");
    table.classList.add("table-striped");

    return table;
}

function formatDate(dateString) {
    // Extrai ano, mês e dia da string
    const year = parseInt(dateString.slice(0, 4));
    const month = parseInt(dateString.slice(4, 6)) - 1; // Mês começa em 0 no JS
    const day = parseInt(dateString.slice(6, 8));

    // Cria um objeto Date apenas com ano, mês e dia
    const date = new Date(year, month, day);

    // Formata a data como d/m/Y
    const dayFormatted = String(date.getDate()).padStart(2, '0');
    const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
    const yearFormatted = date.getFullYear();

    return `${dayFormatted}/${monthFormatted}/${yearFormatted}`;
}