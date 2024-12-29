## **Alura Certificate Downloader**

### **Descrição**
Este projeto é uma ferramenta automatizada desenvolvida em Node.js que permite baixar certificados de cursos e formações da plataforma Alura Start. Ele organiza os certificados em diretórios específicos e gera um arquivo ZIP contendo todos os certificados baixados.

---

### **Instalação e Configuração**
 **Pré-requisitos**:
   - Node.js (versão 14 ou superior).
   - Biblioteca Puppeteer.
   - Biblioteca Archiver.
   - Biblioteca Chalk.
   - Biblioteca Readline.

 **Como executar**:
   - Clone este repositório.
   - Instale as dependências:
     ```bash
     npm install
     ```
   - Execute o comando:
     ```bash
     node index.js
     ```

---

### **Funcionamento**
1. **Solicita o R.A. do Usuário**:
   O programa pede ao usuário que insira o R.A. associado à conta da Alura Start.

2. **Automatiza o Acesso**:
   Usando o Puppeteer, o programa navega até a página do usuário para obter os dados dos certificados.

3. **Baixa Certificados**:
   - Certificados de cursos.
   - Certificados de formações.
   - Certificado completo (Full Certificate).

4. **Organiza os Arquivos**:
   - Diretórios separados para certificados normais e formais.
   - Gera um arquivo ZIP contendo todos os certificados organizados.

---

### **Estrutura do Código**
#### 1. **Dependências e Utilitários**
O código usa bibliotecas como Puppeteer, Chalk e Archiver:
- **Puppeteer**: Automação do navegador.
- **Chalk**: Estilização de logs no terminal.
- **Archiver**: Criação de arquivos ZIP.

#### 2. **Funções Principais**

- **getStudentInfo(page)**  
  Extrai informações do usuário (nome e avatar) da página inicial.

- **createDirectory(dirPath)**  
  Cria diretórios, caso não existam, para armazenar os certificados.

- **createZip(directoryPath, zipPath)**  
  Gera um arquivo ZIP contendo os certificados baixados.

- **downloadCourseCert(cert, browser, coursesDir)**  
  Realiza o download dos certificados de cursos, incluindo certificados normais e formais.

- **downloadFormationCert(cert, browser, formationsDir)**  
  Realiza o download dos certificados de formações.

- **downloadFullCertificate(certLink, browser, raDir)**  
  Realiza o download do certificado completo (Full Certificate).

- **downloadCertificates(userURL)**  
  Controla todo o processo de download e organização dos certificados para um único usuário.

#### 3. **Interface de Entrada**
O sistema solicita que o usuário insira o **R.A.**. Após a entrada, a URL do perfil é gerada automaticamente.

---

### **Exemplo de Uso**
1. **Entrada do R.A.**  
   O sistema pede:  
   ```
   Insira o R.A. do usuário: 00001118855838sp
   ```

2. **Processo Automatizado**  
   O programa acessa a URL do perfil do usuário, baixa os certificados e organiza os arquivos.

3. **Saída**  
   Após a conclusão, o terminal exibirá:  
   ```
   [SUCESSO] Todos os certificados foram baixados e organizados!
   ```

4. **Arquivo ZIP**  
   O arquivo ZIP com os certificados estará disponível no diretório `certificadosZip`.

---

### **Logs**
Os logs informam cada etapa do processo:
- **[INFO]**: Informações sobre o progresso.
- **[SUCESSO]**: Indica ações concluídas com sucesso.
- **[ERRO]**: Aponta erros encontrados.
- **[AVISO]**: Notificações de problemas não críticos.