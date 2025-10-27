// VERSIÓN ALTERNATIVA PARA DEBUGGEAR PROBLEMAS DE SKU
// Esta función puede ser usada temporalmente para diagnosticar problemas

function groupProductsByBase_Debug(products) {
    console.log('🔧 INICIANDO AGRUPAMENTO DEBUG');
    console.log('   Produtos recebidos:', products.length);
    
    // Primeiro, vamos analisar todos os produtos para entender os padrões
    console.log('\n📊 ANÁLISE DE PADRÕES:');
    
    const patterns = {
        withHyphenInId: 0,
        withHyphenInName: 0,
        withVariantFields: 0,
        withCode: 0
    };
    
    products.forEach((product, index) => {
        if (product.id && product.id.includes('-')) patterns.withHyphenInId++;
        if (product.name && product.name.includes(' - ')) patterns.withHyphenInName++;
        if (product.grao || product.diametroExt || product.alturaRoda || product.encaixe) patterns.withVariantFields++;
        if (product.code) patterns.withCode++;
        
        // Log detalhado dos primeiros 5 produtos
        if (index < 5) {
            console.log(`\nProduto ${index + 1}:`);
            console.log('  ID:', product.id);
            console.log('  Nome:', product.name);
            console.log('  Code:', product.code);
            console.log('  Grão:', product.grao);
            console.log('  Diâmetro:', product.diametroExt);
            console.log('  Altura:', product.alturaRoda);
            console.log('  Encaixe:', product.encaixe);
        }
    });
    
    console.log('\nPadrões encontrados:');
    console.log('  IDs com hífen:', patterns.withHyphenInId);
    console.log('  Nomes com " - ":', patterns.withHyphenInName);
    console.log('  Com campos de variante:', patterns.withVariantFields);
    console.log('  Com código:', patterns.withCode);
    
    // Estratégia adaptativa baseada nos padrões encontrados
    let strategy = 'simple';
    
    if (patterns.withHyphenInName > patterns.withHyphenInId * 0.8) {
        strategy = 'name_based';
        console.log('\n✅ Usando estratégia: BASEADA NO NOME');
    } else if (patterns.withVariantFields > products.length * 0.3) {
        strategy = 'field_based';
        console.log('\n✅ Usando estratégia: BASEADA EM CAMPOS');
    } else {
        strategy = 'simple';  
        console.log('\n✅ Usando estratégia: SIMPLES (sem agrupamento)');
    }
    
    const grouped = {};
    
    products.forEach((product, index) => {
        let baseId, baseName, isVariant = false, variantInfo = {};
        
        switch (strategy) {
            case 'name_based':
                if (product.name && product.name.includes(' - ')) {
                    const nameParts = product.name.split(' - ');
                    baseName = nameParts[0];
                    baseId = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    isVariant = true;
                    variantInfo = {
                        value: nameParts[1],
                        sku: product.code || product.id.split('-').pop() || `var${index}`,
                        displayName: nameParts[1]
                    };
                } else {
                    baseId = product.id;
                    baseName = product.name;
                }
                break;
                
            case 'field_based':
                baseName = product.name || 'Produto';
                // Remover informações de variante do nome
                baseName = baseName.replace(/\s*-?\s*(Grão|grão)\s*\d+/i, '');
                baseName = baseName.replace(/\s*-?\s*\d+mm(\s*x\s*\d+mm)?/i, '');
                baseName = baseName.replace(/\s*-?\s*(P\d+|#\d+)/i, '');
                baseName = baseName.trim();
                
                baseId = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                
                if (product.grao || product.diametroExt || product.alturaRoda || product.encaixe) {
                    isVariant = true;
                    let displayName = '';
                    
                    if (product.grao) {
                        displayName = `Grão ${product.grao}`;
                    } else if (product.diametroExt && product.alturaRoda) {
                        displayName = `${product.diametroExt}mm x ${product.alturaRoda}mm`;
                    } else if (product.diametroExt) {
                        displayName = `⌀ ${product.diametroExt}mm`;
                    } else if (product.alturaRoda) {
                        displayName = `Alt. ${product.alturaRoda}mm`;
                    } else if (product.encaixe) {
                        displayName = `Encaixe ${product.encaixe}`;
                    }
                    
                    variantInfo = {
                        value: displayName,
                        sku: product.code || `${baseId}-${index}`,
                        displayName: displayName
                    };
                }
                break;
                
            default: // simple
                baseId = product.id;
                baseName = product.name;
                break;
        }
        
        // Criar produto base se não existe
        if (!grouped[baseId]) {
            grouped[baseId] = {
                ...product,
                id: baseId,
                name: baseName,
                variants: []
            };
        }
        
        // Adicionar variante se detectada
        if (isVariant) {
            grouped[baseId].variants.push({
                value: variantInfo.displayName,
                sku: variantInfo.sku,
                price: product.price || 0,
                currentStock: product.currentStock || 0,
                stock: product.currentStock || 0,
                code: product.code || variantInfo.sku,
                name: variantInfo.displayName,
                // Campos originais
                grao: product.grao,
                diametroExt: product.diametroExt,
                alturaRoda: product.alturaRoda,
                encaixe: product.encaixe,
                type: product.type
            });
            
            // Atualizar produto base com primeira variante
            if (grouped[baseId].variants.length === 1) {
                grouped[baseId].price = product.price;
                grouped[baseId].currentStock = product.currentStock;
            }
        }
    });
    
    const result = Object.values(grouped);
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log('   Produtos agrupados:', result.length);
    
    const withVariants = result.filter(p => p.variants && p.variants.length > 1);
    console.log('   Com variantes:', withVariants.length);
    
    // Log detalhado dos produtos com variantes
    withVariants.forEach((product, index) => {
        console.log(`\n   Produto ${index + 1}: ${product.name}`);
        console.log('     Variantes:', product.variants.length);
        product.variants.forEach((variant, vIndex) => {
            console.log(`       ${vIndex + 1}. ${variant.value} (SKU: ${variant.sku}) - R$ ${variant.price}`);
        });
    });
    
    return result;
}