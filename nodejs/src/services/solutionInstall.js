const { handleError } = require('../utils/helper');
const { spawn } = require('child_process');
const fs = require('fs');

function runBash(command, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('sh', ['-c', command], options);
        child.stdout.on('data', (data) => console.log(String(data).trim()));
        child.stderr.on('data', (data) => console.error(String(data).trim()));
        child.on('close', (code) => {
            return code === 0 ? resolve(code) : reject(new Error(`Command failed: ${command}`));
        });
    });
}

function runBashWithProgress(command, res, progressMessage) {
    return new Promise((resolve, reject) => {
        // Send progress update
        if (res && progressMessage) {
            res.write(`data: ${JSON.stringify({ 
                type: 'progress', 
                message: progressMessage,
                timestamp: new Date().toISOString()
            })}\n\n`);
        }

        const child = spawn('sh', ['-c', command], {});
        
        child.stdout.on('data', (data) => {
            const output = String(data).trim();
            console.log(output);
            
            // Send real-time output to client
            if (res) {
                res.write(`data: ${JSON.stringify({ 
                    type: 'output', 
                    message: output,
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }
        });
        
        child.stderr.on('data', (data) => {
            const error = String(data).trim();
            console.error(error);
            
            // Send error output to client
            if (res) {
                res.write(`data: ${JSON.stringify({ 
                    type: 'error_output', 
                    message: error,
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed: ${command}`));
            }
        });
    });
}

// Function to merge environment variables and create build args
function mergeEnvAndCreateBuildArgs(rootEnvPath, localEnvPath) {
    try {
        // Read root .env file
        let rootEnvVars = {};
        if (fs.existsSync(rootEnvPath)) {
            const rootContent = fs.readFileSync(rootEnvPath, 'utf8');
            rootContent.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    rootEnvVars[key.trim()] = valueParts.join('=').trim();
                }
            });
        }

        // Read local .env file
        let localEnvVars = {};
        if (fs.existsSync(localEnvPath)) {
            const localContent = fs.readFileSync(localEnvPath, 'utf8');
            localContent.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    localEnvVars[key.trim()] = valueParts.join('=').trim();
                }
            });
        }

        // Merge: start with local, add missing from root
        const mergedEnvVars = { ...localEnvVars };
        Object.keys(rootEnvVars).forEach(varName => {
            if (rootEnvVars[varName] && !mergedEnvVars[varName]) {
                mergedEnvVars[varName] = rootEnvVars[varName];
            }
        });

        // Create Docker build args
        const buildArgs = [];
        Object.entries(mergedEnvVars).forEach(([key, value]) => {
            const escapedValue = value.replace(/"/g, '\\"');
            buildArgs.push(`--build-arg ${key}="${escapedValue}"`);
        });

        console.log(`✅ Merged ${Object.keys(mergedEnvVars).length} environment variables`);
        return buildArgs.join(' ');
    } catch (error) {
        console.error('❌ Error merging environment files:', error);
        throw error;
    }
}

// Solution configurations
const SOLUTION_CONFIGS = {
    'ai-doc-editor': {
        repoUrl: 'https://github.com/devweam-ai/ai-doc-editor.git',
        repoName: 'ai-doc-editor',
        imageName: 'ai-doc-editor-img',
        containerName: 'ai-doc-editor-container',
        port: '3002',
        branchName: 'mongodb',
        installType: 'docker', // docker or docker-compose
        envFile: 'env.example'
    },
    'seo-content-gen': {
        repoUrl: 'https://github.com/devweam-ai/seo-content-gen.git',
        repoName: 'seo-content-gen',
        imageName: 'seo-content-gen-img',
        containerName: 'seo-content-gen-container',
        port: '3003',
        branchName: 'opensource-deployment',
        installType: 'docker-compose', // docker or docker-compose
        envFile: null // No env file needed for docker-compose
    }
};

const install = async (req) => {
    try {
        console.log('✅ Static Data: Solution install function running...');
        
        // Get solution type from request body or default to ai-doc-editor
        const solutionType = req.body?.solutionType || 'ai-doc-editor';
        const config = SOLUTION_CONFIGS[solutionType];
        
        if (!config) {
            throw new Error(`Unknown solution type: ${solutionType}`);
        }

        console.log({ id: 1, name: config.repoName, status: 'Started', type: solutionType });

        const repoPath = `/workspace/${config.repoName}`;
        const networkName = 'weamai_app-network';

        // Clean up and clone repository
        await runBash(`rm -rf ${repoPath}`);
        await runBash(`git clone -b ${config.branchName} ${config.repoUrl} ${repoPath}`);

        if (config.installType === 'docker') {
            // Docker-based installation (ai-doc-editor)
            await runBash(`cp ${repoPath}/${config.envFile} ${repoPath}/.env`);
            
            // Merge environment variables and create build args
            const rootEnvPath = '/workspace/.env';
            const localEnvPath = `${repoPath}/.env`;
            const buildArgs = mergeEnvAndCreateBuildArgs(rootEnvPath, localEnvPath);
            
            // Build Docker image with environment variables as build args
            const buildCmd = `docker build -t ${config.imageName} ${buildArgs} ${repoPath}`;
            await runBash(buildCmd);
            
            const runCmd = `docker rm -f ${config.containerName} || true && docker run -d --name ${config.containerName} --network ${networkName} -p ${config.port}:${config.port} ${config.imageName}`;
            await runBash(runCmd);
        } else if (config.installType === 'docker-compose') {
            // Docker-compose based installation (seo-content-gen)
            // Setup environment files for all subdirectories
            await runBash(`find ${repoPath} -name ".env.example" -exec sh -c 'cp "$1" "$(dirname "$1")/.env"' _ {} \\;`);
            
            // First try to install docker-compose if not available
            try {
                // Try to install docker-compose using wget (more commonly available than curl)
                await runBash(`which docker-compose || (wget -O /usr/local/bin/docker-compose "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" && chmod +x /usr/local/bin/docker-compose)`);
                
                // Now run docker-compose
                const composeCmd = `cd ${repoPath} && docker-compose up -d --build`;
                // const composeCmd = `cd ${repoPath} && docker-compose up -d`;
                await runBash(composeCmd);
            } catch (error) {
                console.log('Docker-compose failed, trying alternative approach...');
                // Fallback: try to build and run individual services if docker-compose fails
                // Look for Dockerfile in the root directory
                await runBash(`cd ${repoPath} && if [ -f Dockerfile ]; then docker build -t ${config.imageName} .; else echo "No Dockerfile found in root directory"; fi`);
                await runBash(`docker run -d --name ${config.containerName} --network ${networkName} -p ${config.port}:${config.port} ${config.imageName}`);
            }
        }

        console.log('✅ Solution installation success! Visit 👉 http://localhost:' + config.port);
        return { success: true, port: config.port, solutionType };
    } catch (error) {
        handleError(error, 'Error - solutionInstall');
    }
}

const installWithProgress = async (req, res) => {
    try {
        // Get solution type from request body or default to ai-doc-editor
        const solutionType = req.body?.solutionType || 'ai-doc-editor';
        const config = SOLUTION_CONFIGS[solutionType];
        
        if (!config) {
            throw new Error(`Unknown solution type: ${solutionType}`);
        }

        const repoPath = `/workspace/${config.repoName}`;
        const networkName = 'weamai_app-network';
        const totalSteps = config.installType === 'docker' ? 3 : 3;

        // Step 1: Clean up existing repository
        // res.write(`data: ${JSON.stringify({ 
        //     type: 'progress', 
        //     message: '🧹 Cleaning up existing repository...',
        //     step: 1,
        //     totalSteps: totalSteps
        // })}\n\n`);
        
        // await runBashWithProgress(`rm -rf ${repoPath}`, res, 'Repository cleanup completed');

        // Step 2: Clone repository
        // res.write(`data: ${JSON.stringify({ 
        //     type: 'progress', 
        //     message: '📥 Cloning repository from GitHub...',
        //     step: 2,
        //     totalSteps: totalSteps
        // })}\n\n`);
        
        // await runBashWithProgress(`git clone -b ${config.branchName} ${config.repoUrl} ${repoPath}`, res, 'Repository cloned successfully');

        if (config.installType === 'docker') {
            // Step 1: Setup environment (Docker only)
            res.write(`data: ${JSON.stringify({ 
                type: 'progress', 
                message: '⚙️ Setting up environment configuration...',
                step: 1,
                totalSteps: totalSteps
            })}\n\n`);
            
            await runBashWithProgress(`cp ${repoPath}/${config.envFile} ${repoPath}/.env`, res, 'Environment configuration completed');

            // Merge environment variables and create build args
            const rootEnvPath = '/workspace/.env';
            const localEnvPath = `${repoPath}/.env`;
            const buildArgs = mergeEnvAndCreateBuildArgs(rootEnvPath, localEnvPath);
            
            res.write(`data: ${JSON.stringify({ 
                type: 'output', 
                message: `✅ Environment variables merged: ${buildArgs.split('--build-arg').length - 1} variables`,
                timestamp: new Date().toISOString()
            })}\n\n`);

            // Step 2: Build Docker image
            res.write(`data: ${JSON.stringify({ 
                type: 'progress', 
                message: '🐳 Building Docker image (this may take several minutes)...',
                step: 2,
                totalSteps: totalSteps
            })}\n\n`);
            
            const buildCmd = `docker build -t ${config.imageName} ${buildArgs} ${repoPath}`;
            await runBashWithProgress(buildCmd, res, 'Docker image built successfully');

            // Step 3: Run container
            res.write(`data: ${JSON.stringify({ 
                type: 'progress', 
                message: '🚀 Starting Docker container...',
                step: 3,
                totalSteps: totalSteps
            })}\n\n`);
            
            const runCmd = `docker rm -f ${config.containerName} || true && docker run -d --name ${config.containerName} --network ${networkName} -p ${config.port}:${config.port} ${config.imageName}`;
            await runBashWithProgress(runCmd, res, 'Container started successfully');

        } else if (config.installType === 'docker-compose') {
            // Step 1: Setup environment files
            res.write(`data: ${JSON.stringify({ 
                type: 'progress', 
                message: '⚙️ Setting up environment configuration files...',
                step: 1,
                totalSteps: totalSteps
            })}\n\n`);
            
            await runBashWithProgress(`find ${repoPath} -name "env.example" -exec sh -c 'cp "$1" "$(dirname "$1")/.env"' _ {} \\;`, res, 'Environment files setup completed');

            // Step 2: Install docker-compose if needed
            res.write(`data: ${JSON.stringify({ 
                type: 'progress', 
                message: '📦 Installing Docker Compose if needed...',
                step: 2,
                totalSteps: totalSteps
            })}\n\n`);
            
            try {
                await runBashWithProgress(`which docker-compose || (wget -O /usr/local/bin/docker-compose "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" && chmod +x /usr/local/bin/docker-compose)`, res, 'Docker Compose installation completed');

                // Step 3: Build and run with docker-compose
                res.write(`data: ${JSON.stringify({ 
                    type: 'progress', 
                    message: '🐳 Building and starting services with Docker Compose...',
                    step: 3,
                    totalSteps: totalSteps
                })}\n\n`);
                
                const composeCmd = `cd ${repoPath} && docker-compose up -d --build`;
                await runBashWithProgress(composeCmd, res, 'Docker Compose services started successfully');
            } catch (error) {
                res.write(`data: ${JSON.stringify({ 
                    type: 'progress', 
                    message: '⚠️ Docker Compose failed, trying alternative approach...',
                    step: 3,
                    totalSteps: totalSteps
                })}\n\n`);
                
                // Fallback: try to build and run individual services
                await runBashWithProgress(`cd ${repoPath} && if [ -f Dockerfile ]; then docker build -t ${config.imageName} .; else echo "No Dockerfile found in root directory"; fi`, res, 'Docker image built successfully');
                await runBashWithProgress(`docker run -d --name ${config.containerName} --network ${networkName} -p ${config.port}:${config.port} ${config.imageName}`, res, 'Container started successfully');
            }
        }

        // Final success message
        res.write(`data: ${JSON.stringify({ 
            type: 'success', 
            message: `✅ Installation completed successfully! Your ${config.repoName} solution is now running at http://localhost:${config.port}`,
            url: `http://localhost:${config.port}`,
            step: totalSteps,
            totalSteps: totalSteps,
            solutionType: solutionType
        })}\n\n`);

        console.log('✅ Solution installation success! Visit 👉 http://localhost:' + config.port);
        return { success: true, port: config.port, solutionType };
    } catch (error) {
        res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: `❌ Installation failed: ${error.message}`,
            error: error.message
        })}\n\n`);
        handleError(error, 'Error - solutionInstallWithProgress');
        throw error;
    }
}

module.exports = {
    install,
    installWithProgress,
}