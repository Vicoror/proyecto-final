describe('Pruebas de fetchPedidosCliente', () => {
  const idCliente = '6';

  beforeEach(() => {
    cy.visit('/Cliente'); // Ajusta la ruta
  });

  it('Camino 1: Respuesta exitosa con pedidos', () => {
    cy.intercept('GET', `/api/pedidos/${idCliente}`, {
      statusCode: 200,
      body: {
        success: true,
        pedidos: [
          { id: 1, producto: 'Producto A', estado: 'entregado' },
          { id: 2, producto: 'Producto B', estado: 'pendiente' }
        ]
      }
    }).as('getPedidosSuccess');

    // Simular la acción que dispara fetchPedidosCliente
    cy.get('[data-testid="cargar-pedidos-btn"]').click();
    
    cy.wait('@getPedidosSuccess');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
    cy.get('[data-testid="pedido-item"]').should('have.length', 2);
    cy.contains('Producto A').should('be.visible');
  });

  it('Camino 2: Respuesta exitosa sin pedidos', () => {
    cy.intercept('GET', `/api/pedidos/${idCliente}`, {
      statusCode: 200,
      body: {
        success: true,
        pedidos: []
      }
    }).as('getPedidosEmpty');

    cy.get('[data-testid="cargar-pedidos-btn"]').click();
    
    cy.wait('@getPedidosEmpty');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
    cy.get('[data-testid="pedido-item"]').should('not.exist');
    cy.contains('No hay pedidos').should('be.visible');
  });

  it('Camino 3: Error HTTP 404', () => {
    cy.intercept('GET', `/api/pedidos/${idCliente}`, {
      statusCode: 404,
      body: 'Not Found'
    }).as('getPedidos404');

    cy.get('[data-testid="cargar-pedidos-btn"]').click();
    
    cy.wait('@getPedidos404');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Error 404: Not Found');
  });

  it('Camino 4: Error de red', () => {
    cy.intercept('GET', `/api/pedidos/${idCliente}`, {
      forceNetworkError: true
    }).as('getPedidosNetworkError');

    cy.get('[data-testid="cargar-pedidos-btn"]').click();
    
    cy.wait('@getPedidosNetworkError');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Error');
  });
});