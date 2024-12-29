const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const archiver = require('archiver'); // Verifique se você importou o 'archiver'
const readline = require('readline');

function createZip(directoryPath, zipPath) {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function() {
        log.success(`Arquivo ZIP gerado em: ${zipPath}`);
    });

    archive.on('error', function(err) {
        log.error(`Erro ao gerar o ZIP: ${err.message}`);
    });

    archive.pipe(output);

    archive.on('end', () => {
        log.success('Arquivo ZIP finalizado corretamente!');
    });

    archive.directory(directoryPath, false);
    archive.finalize();

    // Certifique-se de que o fluxo não seja fechado até que o arquivo tenha sido completamente gerado
    return new Promise((resolve, reject) => {
        output.on('close', () => resolve(zipPath));
        archive.on('error', (err) => reject(`Erro ao gerar o arquivo zip: ${err.message}`));
    });
}

// Configuração de cores para logs
const log = {
    info: (msg) => console.log(chalk.blue('[INFO]'), msg),
    success: (msg) => console.log(chalk.green('[SUCESSO]'), msg),
    error: (msg) => console.log(chalk.red('[ERRO]'), msg),
    warning: (msg) => console.log(chalk.yellow('[AVISO]'), msg),
};

async function getStudentInfo(page) {
    try {
      // Espera a div inteira estar presente
      await page.waitForSelector('div.profile-header-avatarAndEdit-wrapper.profile-header--alura', { timeout: 5000 });
  
      // Extrai o nome e o avatar da div
      const studentInfo = await page.$eval(
        'div.profile-header-avatarAndEdit-wrapper.profile-header--alura',
        (div) => {
          const name = div.querySelector('h2.profile-header-name.bootcamp-text-color')?.innerText.trim();
          const avatarUrl = div.querySelector('img.profile-header-avatar')?.src;
          
          return { name, avatarUrl };
        }
      );
      
      if (!studentInfo.name || !studentInfo.avatarUrl) {
        throw new Error('Informações do aluno não encontradas.');
      }
  
      return studentInfo;
    } catch (error) {
      log.error('Erro ao extrair informações do aluno:', error);
      return null;
    }
  }
  
// Configuração de pastas
function createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log.success(`Pasta criada: ${dirPath}`);
    }
}

// Função para baixar certificados de cursos
async function downloadCourseCert(cert, browser, coursesDir) {
    const normalDir = path.join(coursesDir, 'normal');
    const formalDir = path.join(coursesDir, 'formal');

    createDirectory(normalDir);
    createDirectory(formalDir);

    log.info(`Baixando certificado curso: ${cert.course}`);
    const certPage = await browser.newPage();
    await certPage.goto(cert.href, { waitUntil: 'networkidle2' });

    // Baixa certificado normal
    const normalPdfPath = path.join(normalDir, `${cert.course}.pdf`);
    await certPage.pdf({ path: normalPdfPath, format: 'A4', printBackground: true });
    log.success(`Certificado normal salvo em: ${normalPdfPath}`);

    // Procura e baixa o certificado formal
    const formalButtonSelector = '.options-footer.options-print .buttonLink';
    const formalButton = await certPage.$(formalButtonSelector);

    if (formalButton) {
        const formalLink = await certPage.evaluate((btn) => btn.href, formalButton);

        const formalCertPage = await browser.newPage();
        await formalCertPage.goto(formalLink, { waitUntil: 'networkidle2' });

        const formalPdfPath = path.join(formalDir, `${cert.course}.pdf`);
        await formalCertPage.pdf({ path: formalPdfPath, format: 'A4', printBackground: true });
        log.success(`Certificado formal salvo em: ${formalPdfPath}`);

        await formalCertPage.close();
    } else {
        log.warning(`Botão para certificado formal não encontrado em: ${cert.href}`);
    }

    await certPage.close();
}

// Função para baixar certificados de formações
async function downloadFormationCert(cert, browser, formationsDir) {
    const formationName = cert.formation.replace(/-\d+$/, ''); // Remove números finais
    log.info(`Baixando certificado formação: ${formationName}`);

    const certPage = await browser.newPage();
    await certPage.goto(cert.href, { waitUntil: 'networkidle2' });

    const pdfPath = path.join(formationsDir, `${formationName}.pdf`);
    await certPage.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    log.success(`Certificado formação salvo em: ${pdfPath}`);

    await certPage.close();
}

// Função para baixar certificado completo (fullCertificate)
async function downloadFullCertificate(certLink, browser, raDir) {
    log.info(`Baixando certificado completo (fullCertificate)`);

    const certPage = await browser.newPage();
    await certPage.goto(certLink, { waitUntil: 'networkidle2' });

    const pdfPath = path.join(raDir, 'fullCertificate.pdf');
    await certPage.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    log.success(`Certificado completo salvo em: ${pdfPath}`);

    await certPage.close();
}

// Função principal
async function downloadCertificates(userURL) {
    const browser = await puppeteer.launch({
        headless: true, // Modo sem interface gráfica
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Melhora a compatibilidade em servidores
    });
    const page = await browser.newPage();

    try {
        log.info(`Acessando URL do usuário: ${userURL}`);
        await page.goto(userURL, { waitUntil: 'networkidle2' });

        // Obter o nome do aluno
        const studentName = await getStudentInfo(page);
        log.info(`Nome do aluno: ${studentName.name}`);

        await page.waitForSelector('a.course-card__certificate');

        // Certificados de cursos
        const courseCertificates = await page.$$eval(
            'a.course-card__certificate',
            (links) =>
                links.map((link) => ({
                    href: link.href,
                    course: link.href.split('/course/')[1].split('/certificate')[0],
                }))
        );

        // Certificados de formações
        const degreeCertificates = await page.$$eval(
            'a.lightCard-otherLinks-link.lightCard-otherLinks-certificate',
            (links) =>
                links.map((link) => ({
                    href: link.href,
                    formation: link.href.split('/degree-')[1].split('/certificate')[0],
                }))
        );

        // Link do certificado completo (fullCertificate)
        const fullCertificateLink = await page.$eval(
            'a.profile-fullCertificate-link',
            (link) => link.href
        );

        log.info(`Link do certificado completo encontrado: ${fullCertificateLink}`);

        const studentId = userURL.split('/user/')[1];
        const baseDir = path.resolve(__dirname, 'certificados', studentId);

        // Criação de diretórios
        const coursesDir = path.join(baseDir, 'cursos');
        const formationsDir = path.join(baseDir, 'formações');

        createDirectory(coursesDir);
        createDirectory(formationsDir);

        // Baixar o certificado completo
        await downloadFullCertificate(fullCertificateLink, browser, baseDir);

        // Baixar certificados de cursos
        for (const cert of courseCertificates) {
            await downloadCourseCert(cert, browser, coursesDir);
        }

        // Baixar certificados de formações
        for (const cert of degreeCertificates) {
            await downloadFormationCert(cert, browser, formationsDir);
        }

        const certificadosZip = path.resolve(__dirname, 'certificadosZip');
        createDirectory(certificadosZip);

        const zipPath = path.join(certificadosZip, `${studentId}.zip`);
        createZip(baseDir, zipPath)

        log.success('Todos os certificados foram baixados e organizados!');
    } catch (error) {
        log.error('Erro ao processar os certificados:', error);
    } finally {
        await browser.close();
        log.info('Navegador fechado.');
    }
}
// Função para criar input no terminal
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    }));
}

(async () => {
    try {
        const ra = await askQuestion('Digite o R.A do usuário: ');
        const userURL = `https://cursos.alura.com.br/user/${ra}`;

        await downloadCertificates(userURL)
            .then(() => log.success('Todos os certificados foram baixados!'))
            .catch((err) => log.error('Erro no processamento:', err));
    } catch (err) {
        log.error('Erro ao executar o programa:', err);
    }
})();