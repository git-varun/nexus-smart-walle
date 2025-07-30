#!/usr/bin/env node

/**
 * Comprehensive test runner for Nexus Smart Wallet Backend
 * Provides various testing options and utilities
 */

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.testCategories = {
            unit: 'tests/unit',
            integration: 'tests/integration',
            e2e: 'tests/e2e',
            all: '.'
        };

        this.coverageThresholds = {
            statements: 80,
            branches: 75,
            functions: 85,
            lines: 80
        };
    }

    /**
     * Display usage information
     */
    showHelp() {
        console.log(`
🧪 Nexus Smart Wallet Backend Test Runner

Usage: node scripts/test-runner.js [command] [options]

Commands:
  run [category]     Run tests (unit|integration|e2e|all)
  coverage          Run tests with coverage report
  watch             Run tests in watch mode
  ci                Run tests for CI/CD (with coverage + lint)
  lint              Run only linting
  type-check        Run only type checking
  clean             Clean test artifacts and coverage
  report            Generate detailed test report
  health            Check test environment health

Options:
  --verbose         Show detailed output
  --bail            Stop on first test failure
  --updateSnapshot  Update Jest snapshots
  --silent          Minimize output
  --grep <pattern>  Run tests matching pattern
  --timeout <ms>    Set test timeout (default: 10000)

Examples:
  node scripts/test-runner.js run unit
  node scripts/test-runner.js coverage --verbose
  node scripts/test-runner.js watch integration
  node scripts/test-runner.js ci
`);
    }

    /**
     * Execute command and handle errors
     */
    exec(command, options = {}) {
        try {
            console.log(`🔧 Executing: ${command}`);
            const output = execSync(command, {
                stdio: options.silent ? 'pipe' : 'inherit',
                encoding: 'utf8',
                ...options
            });
            return {success: true, output};
        } catch (error) {
            console.error(`❌ Command failed: ${command}`);
            console.error(error.message);
            return {success: false, error: error.message};
        }
    }

    /**
     * Check if required dependencies are installed
     */
    checkDependencies() {
        console.log('🔍 Checking dependencies...');

        const requiredDeps = ['jest', 'typescript', 'ts-jest'];
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const allDeps = {...packageJson.devDependencies, ...packageJson.dependencies};

        const missing = requiredDeps.filter(dep => !allDeps[dep]);

        if (missing.length > 0) {
            console.error(`❌ Missing dependencies: ${missing.join(', ')}`);
            console.log('Run: npm install');
            return false;
        }

        console.log('✅ All dependencies found');
        return true;
    }

    /**
     * Check test environment health
     */
    checkEnvironment() {
        console.log('🏥 Checking test environment health...');

        const checks = [
            {
                name: 'Node.js version',
                check: () => {
                    const version = process.version;
                    const major = parseInt(version.slice(1).split('.')[0]);
                    return major >= 18;
                },
                fix: 'Update to Node.js 18 or higher'
            },
            {
                name: 'Test directories',
                check: () => fs.existsSync('tests') && fs.existsSync('tests/unit'),
                fix: 'Run npm run setup:tests or create test directories'
            },
            {
                name: 'Jest config',
                check: () => fs.existsSync('jest.config.js'),
                fix: 'Create jest.config.js configuration file'
            },
            {
                name: 'TypeScript config',
                check: () => fs.existsSync('tsconfig.json'),
                fix: 'Create tsconfig.json configuration file'
            }
        ];

        let allHealthy = true;
        checks.forEach(({name, check, fix}) => {
            const isHealthy = check();
            console.log(`${isHealthy ? '✅' : '❌'} ${name}`);
            if (!isHealthy) {
                console.log(`   Fix: ${fix}`);
                allHealthy = false;
            }
        });

        return allHealthy;
    }

    /**
     * Run specific test category
     */
    runTests(category = 'all', options = {}) {
        if (!this.checkDependencies()) return false;

        const testPath = this.testCategories[category] || category;

        let jestArgs = [testPath];

        if (options.verbose) jestArgs.push('--verbose');
        if (options.bail) jestArgs.push('--bail');
        if (options.updateSnapshot) jestArgs.push('--updateSnapshot');
        if (options.grep) jestArgs.push(`--testNamePattern="${options.grep}"`);
        if (options.timeout) jestArgs.push(`--testTimeout=${options.timeout}`);

        const command = `npx jest ${jestArgs.join(' ')}`;
        const result = this.exec(command, {silent: options.silent});

        return result.success;
    }

    /**
     * Run tests with coverage
     */
    runCoverage(options = {}) {
        console.log('📊 Running tests with coverage...');

        const jestArgs = ['--coverage'];
        if (options.verbose) jestArgs.push('--verbose');

        const command = `npx jest ${jestArgs.join(' ')}`;
        const result = this.exec(command);

        if (result.success) {
            console.log('\n📈 Coverage report generated at: coverage/lcov-report/index.html');
            this.checkCoverageThresholds();
        }

        return result.success;
    }

    /**
     * Check if coverage meets minimum thresholds
     */
    checkCoverageThresholds() {
        const coveragePath = 'coverage/coverage-summary.json';
        if (!fs.existsSync(coveragePath)) {
            console.log('⚠️  Coverage summary not found');
            return false;
        }

        try {
            const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
            const total = coverage.total;

            console.log('\n📊 Coverage Summary:');
            let allMet = true;

            Object.entries(this.coverageThresholds).forEach(([metric, threshold]) => {
                const actual = total[metric].pct;
                const met = actual >= threshold;
                const status = met ? '✅' : '❌';

                console.log(`${status} ${metric}: ${actual}% (threshold: ${threshold}%)`);
                if (!met) allMet = false;
            });

            if (allMet) {
                console.log('\n🎉 All coverage thresholds met!');
            } else {
                console.log('\n⚠️  Some coverage thresholds not met');
            }

            return allMet;
        } catch (error) {
            console.error('❌ Error reading coverage summary:', error.message);
            return false;
        }
    }

    /**
     * Run tests in watch mode
     */
    runWatch(category = 'all', options = {}) {
        console.log('👀 Running tests in watch mode...');
        console.log('Press q to quit, u to update snapshots');

        const testPath = this.testCategories[category] || category;
        const command = `npx jest ${testPath} --watch`;

        return this.exec(command).success;
    }

    /**
     * Run CI/CD pipeline tests
     */
    runCI(options = {}) {
        console.log('🔄 Running CI/CD test pipeline...');

        const steps = [
            {name: 'Type Check', command: 'npm run type-check'},
            {name: 'Lint', command: 'npm run lint'},
            {name: 'Tests with Coverage', command: 'npm run test:coverage'}
        ];

        for (const step of steps) {
            console.log(`\n📋 ${step.name}...`);
            const result = this.exec(step.command, {silent: options.silent});

            if (!result.success) {
                console.error(`❌ ${step.name} failed`);
                return false;
            }

            console.log(`✅ ${step.name} passed`);
        }

        console.log('\n🎉 All CI checks passed!');
        return true;
    }

    /**
     * Run linting only
     */
    runLint(options = {}) {
        console.log('🔍 Running ESLint...');
        const command = options.fix ? 'npm run lint:fix' : 'npm run lint';
        return this.exec(command).success;
    }

    /**
     * Run type checking only
     */
    runTypeCheck() {
        console.log('🔷 Running TypeScript type check...');
        return this.exec('npm run type-check').success;
    }

    /**
     * Clean test artifacts
     */
    clean() {
        console.log('🧹 Cleaning test artifacts...');

        const pathsToClean = [
            'coverage',
            'node_modules/.cache/jest',
            '.nyc_output'
        ];

        pathsToClean.forEach(p => {
            if (fs.existsSync(p)) {
                this.exec(`rm -rf ${p}`);
                console.log(`✅ Cleaned ${p}`);
            }
        });

        console.log('🎉 Cleanup complete');
    }

    /**
     * Generate detailed test report
     */
    generateReport() {
        console.log('📝 Generating detailed test report...');

        const reportDir = 'test-reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(reportDir, `test-report-${timestamp}.json`);

        const command = `npx jest --outputFile=${reportFile} --json --coverage`;
        const result = this.exec(command, {silent: true});

        if (result.success) {
            console.log(`📊 Test report generated: ${reportFile}`);

            // Generate HTML report
            const htmlReport = reportFile.replace('.json', '.html');
            this.generateHTMLReport(reportFile, htmlReport);
            console.log(`🌐 HTML report generated: ${htmlReport}`);
        }

        return result.success;
    }

    /**
     * Generate HTML report from JSON
     */
    generateHTMLReport(jsonFile, htmlFile) {
        try {
            const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - Nexus Smart Wallet Backend</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .test-suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .test-case { margin: 10px 0; padding: 10px; background: #f9f9f9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report - Nexus Smart Wallet Backend</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p class="${data.success ? 'success' : 'failure'}">
            Overall Status: ${data.success ? 'PASSED' : 'FAILED'}
        </p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <h3>Total Tests</h3>
            <p>${data.numTotalTests}</p>
        </div>
        <div class="stat">
            <h3>Passed</h3>
            <p class="success">${data.numPassedTests}</p>
        </div>
        <div class="stat">
            <h3>Failed</h3>
            <p class="failure">${data.numFailedTests}</p>
        </div>
        <div class="stat">
            <h3>Duration</h3>
            <p>${(data.runTime / 1000).toFixed(2)}s</p>
        </div>
    </div>
    
    <h2>Test Suites</h2>
    ${data.testResults.map(suite => `
        <div class="test-suite">
            <h3>${suite.name}</h3>
            <p>Tests: ${suite.numPassingTests + suite.numFailingTests} | 
               Passed: <span class="success">${suite.numPassingTests}</span> | 
               Failed: <span class="failure">${suite.numFailingTests}</span></p>
            ${suite.assertionResults.map(test => `
                <div class="test-case ${test.status}">
                    <strong>${test.title}</strong>
                    <span class="${test.status === 'passed' ? 'success' : 'failure'}">
                        ${test.status.toUpperCase()}
                    </span>
                    ${test.failureMessages.length > 0 ? `
                        <pre>${test.failureMessages.join('\\n')}</pre>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;

            fs.writeFileSync(htmlFile, html);
        } catch (error) {
            console.error('❌ Error generating HTML report:', error.message);
        }
    }
}

// CLI Interface
function main() {
    const runner = new TestRunner();
    const args = process.argv.slice(2);
    const command = args[0];
    const options = {};

    // Parse options
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            if (args[i + 1] && !args[i + 1].startsWith('--')) {
                options[key] = args[i + 1];
                i++; // Skip next arg as it's the value
            } else {
                options[key] = true;
            }
        }
    }

    switch (command) {
        case 'run':
            const category = args[1] && !args[1].startsWith('--') ? args[1] : 'all';
            process.exit(runner.runTests(category, options) ? 0 : 1);
            break;

        case 'coverage':
            process.exit(runner.runCoverage(options) ? 0 : 1);
            break;

        case 'watch':
            const watchCategory = args[1] && !args[1].startsWith('--') ? args[1] : 'all';
            process.exit(runner.runWatch(watchCategory, options) ? 0 : 1);
            break;

        case 'ci':
            process.exit(runner.runCI(options) ? 0 : 1);
            break;

        case 'lint':
            process.exit(runner.runLint(options) ? 0 : 1);
            break;

        case 'type-check':
            process.exit(runner.runTypeCheck() ? 0 : 1);
            break;

        case 'clean':
            runner.clean();
            process.exit(0);
            break;

        case 'report':
            process.exit(runner.generateReport() ? 0 : 1);
            break;

        case 'health':
            const healthy = runner.checkEnvironment();
            process.exit(healthy ? 0 : 1);
            break;

        case 'help':
        case '--help':
        case '-h':
            runner.showHelp();
            process.exit(0);
            break;

        default:
            console.error(`❌ Unknown command: ${command || '(none)'}`);
            runner.showHelp();
            process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = TestRunner;
