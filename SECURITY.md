# Seguridad

## Cómo reportar

Si encuentras una vulnerabilidad, abre un aviso privado de GitHub en [derekCmorales/deploya](https://github.com/derekCmorales/deploya/security/advisories/new).

No abras un issue público con el detalle. No pegues secretos, tokens ni el contenido de un `.env`.

## Qué protege la plataforma

- **Variables cifradas.** El valor de cada variable de entorno del proyecto se guarda cifrado (AES-GCM, con `CLAVE_CIFRADO_VARIABLES`). En la base no queda el valor en claro.
- **Contenedores sin privilegios.** La aplicación corre con `CapDrop: ALL`, `no-new-privileges` y un usuario sin privilegios.
- **Nada de secretos en el repo.** `.env` y `.env.vps` están en `.gitignore`. El historial se revisa con gitleaks. Un hallazgo que no es un secreto se anota en [`.gitleaks.toml`](.gitleaks.toml) con su motivo.

Quien autoaloja cuida su servidor. El contrato está en [docs/contratos/instalacion.md](docs/contratos/instalacion.md).
