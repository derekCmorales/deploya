# Spec Delta

## ADDED Requirements

### Requirement: Ilustraciones de acceso

Las pantallas de acceso (01, 03) SHALL mostrar su ilustración con movimiento usando solo tokens del design system y animando solo `transform` y `opacity`. Con `prefers-reduced-motion: reduce` la ilustración SHALL quedar quieta. La ilustración SHALL ser decorativa (`aria-hidden`) y el formulario SHALL usarse igual sin ella.

#### Scenario: Movimiento reducido

- **WHEN** el sistema operativo pide movimiento reducido y el cliente abre 01
- **THEN** la ilustración se ve completa y quieta, y el formulario funciona igual

#### Scenario: Ilustración decorativa

- **WHEN** un lector de pantalla recorre 03
- **THEN** no anuncia la ilustración ni le da foco; el orden de tabulación es el del formulario

#### Scenario: Solo tokens

- **WHEN** se cambia el tema a oscuro en 01
- **THEN** la ilustración usa los colores del tema oscuro sin valores sueltos
