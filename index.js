const { spawn } = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const Docker = require('dockerode');
const app = express();
const cors = require("cors");
const port = 8080;
const docker = new Docker();

// Middleware to parse JSON in the request body
app.use(bodyParser.json());
app.use(cors());
// Route to handle the POST request
app.post('/compile', async (req, res) => {
  const { code, language } = req.body;

  try {
    const result = await compileCode(code, language);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function sanitizeCode(code, language) {
  // Add your code sanitization logic here
  // This is just a basic example using regex to remove potentially harmful code

  if (language === 'php') {
    code = code.replace(/(session_start|setcookie|$_SESSION|$_POST|$_FILES|eval|exec|system|passthru|shell_exec|popen|proc_open|fopen|fclose|fwrite|unlink|readdir|opendir|rmdir|rename)/g, '');
    code = code.replace(/<(?:\?|\%)\=?(?:php)?/gi, '&lt;?php');
  } else if (language === 'python') {
    code = code.replace(/(__import__|os\..*|subprocess\..*|eval|open|close|write|remove|listdir|removedirs|rename)/g, '');
  } else if (language === 'java') {
    code = code.replace(/(exec|processBuilder|File|FileWriter|FileReader|BufferedReader|BufferedWriter|delete|listFiles|delete|renameTo)/g, '');
    code = code.replaceAll("(java\\.io\\..*|java\\.nio\\..*|java\\.nio\\.file\\..*|java\\.nio\\.channels\\..*)", "");
  } else if (language === 'javascript') {
    code = code.replace(/(eval|Function|setTimeout|setInterval)/g, '');
    code = code.replace(/(fs\..*|require\(.+?\))/g, '');
  }

  return code;
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


function compileCode(code, language) {
  return new Promise((resolve, reject) => {
    code = sanitizeCode(code, language)
    console.log(code)
    if (language === 'javascript') {
      // Execute JavaScript code
      try {
        const result = eval(code);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    } else if (language === 'node') {
      // Execute Node.js script
      const nodeProcess = spawn('node', ['-e', code]);

      let output = '';
      let errorOutput = '';

      nodeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      nodeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      nodeProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(errorOutput));
        }
      });
    } else if (language === 'react') {
      // Transpile and execute React.js code using Babel
      try {
        const transpiledCode = require('@babel/core').transformSync(code, {
          presets: ['@babel/preset-react'],
        }).code;
        const result = eval(transpiledCode);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    } else if (language === 'python') {
      // Execute Python code
      const pythonProcess = spawn('python3', ['-c', code]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(errorOutput));
        }
      });
    } else if (language === 'php'){
      const phpProcess = spawn('php', ['-r', code]);
      let output = '';
      let errorOutput = '';

      phpProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      phpProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      phpProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(errorOutput));
        }
  });
    }else {
      reject(new Error('Invalid language'));
    }
  });
}
