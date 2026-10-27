# Zork Organiza — primeira versão

Site pessoal para rotinas, ideias, notas, documentos, planilhas, calendário, planejamento de investimentos e doações via Pix. Projeto estático feito com **HTML, CSS e JavaScript**, sem servidor próprio. Preparado para hospedar no **GitHub Pages**.

## Recursos da versão 1

- **Início:** apresentação do projeto, tarefas recentes, progresso e informações básicas.
- **Rotinas:** atividades, checkbox de conclusão, prazo, prioridade e pesquisa.
- **Ideias:** registros com categoria e descrição.
- **Calculadora:** operações básicas, parênteses, porcentagem e teclado.
- **Bloco de notas:** cartões coloridos, fixação e autosalvamento.
- **Word / Editor:** documentos na prateleira (10 visíveis inicialmente, com “Ver mais”), rich text, alinhamento, fonte, tamanho, cor, listas, desfazer/refazer, imprimir e exportar HTML.
- **Planilhas:** múltiplos arquivos e abas, células editáveis, fórmulas, referências, funções `SUM`, `SOMA`, `AVERAGE`, `MEDIA`, `MIN`, `MAX`, `COUNT`, linhas/colunas adicionais, importação/exportação CSV. Limite desta versão: até 300 linhas × 40 colunas por aba. **Não é um Excel completo** — não há macros, tabelas dinâmicas, gráficos, fórmulas avançadas, arquivos XLSX nativos ou compatibilidade total.
- **Datas:** calendário mensal, compromissos com título/descrição, ponto vermelho nos dias com evento.
- **Investimentos:** planejamento semanal em grupos de 7 dias (incluindo dias 29, 30 e 31 em “dias restantes”) ou mensal, adicionar anos em blocos de 12 meses, total registrado e simulação de juros compostos para taxa manual CDI/CDB/Selic/Tesouro Selic/taxa fixa. **Estimativa matemática, não consulta a taxas oficiais e não é consultoria financeira**. Tributação é simplificada.
- **Área mista:** escolher até quatro widgets para ver na mesma tela.
- **Acessibilidade/temas:** 4 paletas (dark, light, galáxia clara, galáxia noturna) × 3 estilos (moderno, intermediário, clássico).
- **Donation:** QR Code Pix e código copia e cola fornecidos pelo criador.
- **Dados:** visitante guarda no `localStorage` do dispositivo/navegador; backup completo `.json` e restauração; login com Google ou e-mail/senha e sincronização de registros pelo Firebase Authentication + Cloud Firestore quando configurado.
- **Celular:** layout responsivo e menu lateral adaptado. Animações leves respeitam “reduzir movimento” do sistema.

## Como publicar no GitHub Pages

1. Crie um repositório público no GitHub, por exemplo `Zork-Organiza`.
2. Faça upload do **conteúdo da pasta** `Zork_Organiza` para a raiz do repositório: `index.html`, `styles.css`, `config.js`, `js/`, `assets/` etc.
3. No repositório, acesse **Settings → Pages → Build and deployment**. Selecione **Deploy from a branch**, branch **main**, pasta **/(root)** e salve.
4. Sua página ficará parecida com `https://SEU-USUARIO.github.io/Zork-Organiza/` (o endereço exato depende do repositório).
5. Sem configurar Firebase, o site **funciona em modo visitante**, mas os dados não se sincronizam entre navegador/celular.

> Para abrir localmente e testar módulos ES, inicie um servidor estático no diretório (`python -m http.server 8000`) e acesse `http://localhost:8000`. Abrir `index.html` via `file://` pode impedir imports JS em alguns navegadores.

## Ativar login e sincronização ao vivo — Firebase

O **GitHub Pages não executa um banco de dados nem autenticação no servidor**. Por isso o projeto utiliza Firebase opcionalmente.

1. Entre em [console.firebase.google.com](https://console.firebase.google.com/) e crie um projeto.
2. Crie um **aplicativo Web** em **Configurações do projeto → Seus apps → Web**. Copie `firebaseConfig`.
3. Edite `config.js` e substitua `null` pelas propriedades públicas fornecidas:

   ```js
   window.ZORK_FIREBASE_CONFIG = {
     apiKey: "SUA_CHAVE_WEB",
     authDomain: "SEU-PROJETO.firebaseapp.com",
     projectId: "SEU-PROJETO",
     appId: "SEU_APP_ID"
   };
   ```

4. Em **Build → Authentication → Sign-in method**, habilite **Google** e/ou **Email/Password**. Configure o e-mail de suporte para autenticação Google.
5. Em **Authentication → Settings → Authorized domains**, autorize seu domínio do GitHub Pages (`SEU-USUARIO.github.io`) ou domínio personalizado. Domínios não autorizados impedem o login. Para OAuth via redirecionamento em alguns navegadores móveis, pode ser necessário configurar um domínio de autenticação próprio conforme a documentação do Firebase.
6. Em **Build → Firestore Database**, crie o banco de dados e publique as regras de `firebase.rules` em **Firestore Database → Rules**. **Não use regras públicas de leitura/escrita.**
7. Faça commit do `config.js` modificado. Depois da publicação, entre no site e autentique-se.
8. Na primeira vez em uma conta nova, o banco começa vazio. Em **Configurações → Importar anotações deste navegador**, você pode copiar seus dados anteriores de visitante.

O Firestore usa um documento por item (tarefa, nota, aporte, planilha etc.). A atualização de cada registro é refletida nas outras sessões conectadas por listeners em tempo real, **quando há internet**. Se duas pessoas editarem *o mesmo item ao mesmo tempo*, a última gravação prevalece. Isso **não é edição colaborativa caractere por caractere** no estilo Google Docs. O Firestore tem custos/cotas e limite de tamanho por documento (cerca de 1 MiB), portanto planilhas enormes exigirão uma arquitetura mais robusta.

As informações do `firebaseConfig` são **configurações públicas** da aplicação, não credenciais privadas; quem protege os dados são as regras de segurança de acesso com `request.auth.uid == userId`. Nunca insira credenciais de administrador, service accounts ou senhas em arquivos do site.

## Dados pessoais, segurança e Pix

- Visitante: `localStorage` é separado por origem do site e perfil/navegador; limpar dados do navegador ou usar modo anônimo pode apagar o progresso. **Baixe backups periodicamente.**
- Usuários autenticados: itens são separados no Firestore pelo UID do login e as regras fazem isolamento por usuário. O navegador também mantém cache local próprio; o que garante acesso em outros dispositivos é o Firestore.
- Arquivos `.json` de backup podem conter dados pessoais e devem ser guardados com segurança.
- O Pix da seção Donation é o **código exatamente fornecido pelo criador**, gerado como QR Code local para evitar serviços de terceiros. O payload tem CRC verificado, mas **confira o destinatário no aplicativo do banco** antes de pagar.
- O código Pix fornecido inclui o nome **Caio da Silva Moreira**, que pode aparecer para doadores. Caso prefira privacidade, crie e teste uma chave/cobrança apropriada em serviço que ofereça conta empresarial ou identificação pública adequada — o site não consegue esconder o nome mostrado pelo banco.
- Este protótipo **não tem lembretes por push, integração com corretoras, Excel completo ou editor Word 100% compatível**.

## Arquivos

```text
Zork_Organiza/
├── index.html
├── styles.css
├── config.js                   ← configurar Firebase se desejar
├── firebase.rules              ← publicar no Firestore
├── js/
│   ├── app.js                  ← interface e fluxos
│   ├── store.js                ← persistência, auth, sincronização
│   └── math.js                 ← cálculos e fórmulas
└── assets/
    ├── favicon.svg
    └── pix-qr.png
```

**Projeto versão 1:** foi feito para poder publicar primeiro, usar em modo convidado e evoluir sem depender de servidor próprio. Recomenda-se testar login, regras, backups e conflito de edição antes de convidar outras pessoas a armazenarem informações importantes nele.
