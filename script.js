// 全局变量
let pyodide;
let isPyodideLoaded = false;

// DOM元素
const codeInput = document.getElementById('code-input');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const feedbackContent = document.getElementById('feedback-content');
const loadingIndicator = document.getElementById('loading');

// 初始化Pyodide
async function initializePyodide() {
    try {
        loadingIndicator.classList.remove('hidden');
        feedbackContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>正在加载Python环境（首次加载约需10秒）...</p>
            </div>
        `;
        
        // 加载Pyodide
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
            stdout: () => {}, // 忽略标准输出
            stderr: () => {}  // 忽略标准错误
        });
        
        isPyodideLoaded = true;
        loadingIndicator.classList.add('hidden');
        feedbackContent.innerHTML = `
            <div class="status">
                <i class="fas fa-check-circle" style="color:#4caf50; font-size:2rem;"></i>
                <p>Python环境已就绪！</p>
                <p>现在可以编写并检查Python函数了</p>
            </div>
        `;
    } catch (error) {
        feedbackContent.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>环境加载失败</h3>
                <p>错误信息: ${error.message}</p>
                <p>请检查网络连接后刷新页面重试</p>
            </div>
        `;
    }
}

// 检查语法
async function checkSyntax() {
    if (!isPyodideLoaded) {
        alert("Python环境仍在加载中，请稍候...");
        return;
    }
    
    const code = codeInput.value.trim();
    if (!code) {
        feedbackContent.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <p>请输入Python函数代码</p>
            </div>
        `;
        return;
    }
    
    feedbackContent.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>正在分析代码...</p>
        </div>
    `;
    
    try {
        // 使用Pyodide检查语法
        await pyodide.runPythonAsync(code);
        
        // 提取函数信息
        const functionName = extractFunctionName(code);
        const parameters = extractParameters(code);
        
        // 显示成功信息
        feedbackContent.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i>
                <h3>语法正确！</h3>
                <p>函数定义符合Python语法规范</p>
                <div class="preview">
                    <div class="preview-title">函数定义预览：</div>
                    <code>${functionName}(${parameters})</code>
                </div>
            </div>
        `;
    } catch (error) {
        // 优化错误提示
        const errorMessage = formatPythonError(error.message);
        
        feedbackContent.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>发现语法错误</h3>
                <pre>${errorMessage}</pre>
                <div class="preview">
                    <div class="preview-title">错误分析：</div>
                    <p>${getErrorExplanation(errorMessage)}</p>
                </div>
            </div>
        `;
    }
}

// 提取函数名
function extractFunctionName(code) {
    const match = code.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : '未知函数';
}

// 提取参数
function extractParameters(code) {
    const match = code.match(/\(([^)]*)\)/);
    return match ? match[1] : '';
}

// 格式化Python错误信息
function formatPythonError(error) {
    // 简化错误信息
    const simplifiedError = error
        .replace(/File "<exec>", line (\d+)/g, '第$1行')
        .replace(/SyntaxError: /g, '语法错误: ')
        .replace(/IndentationError: /g, '缩进错误: ')
        .replace(/NameError: /g, '名称错误: ')
        .replace(/TypeError: /g, '类型错误: ')
        .replace(/invalid syntax/g, '无效的语法')
        .replace(/unexpected indent/g, '意外的缩进')
        .replace(/expected an indented block/g, '需要缩进的代码块')
        .replace(/unindent does not match .* level/g, '缩进级别不匹配');
    
    return simplifiedError;
}

// 获取错误解释
function getErrorExplanation(error) {
    if (error.includes('语法错误')) {
        return '请检查函数定义格式是否正确，特别是def关键字、函数名、括号和冒号(:)的使用。';
    }
    if (error.includes('缩进错误')) {
        return 'Python使用缩进来表示代码块，请确保函数体有统一的缩进（通常为4个空格）。';
    }
    if (error.includes('名称错误')) {
        return '函数名或变量名使用错误，请确保只使用字母、数字和下划线，且不能以数字开头。';
    }
    if (error.includes('无效的字符')) {
        return '代码中包含了Python不允许的特殊字符，请检查函数名或参数名是否合法。';
    }
    return '请仔细检查代码结构，确保符合Python函数定义的基本规则。';
}

// 重置代码
function resetCode() {
    codeInput.value = `def 函数名称(参数1, 参数2):
    # 在此处编写函数体
    # 可以使用 return 返回结果
    pass`;
    feedbackContent.innerHTML = `
        <div class="status">
            <i class="fas fa-arrow-circle-left" style="font-size: 2rem; color: #90a4ae;"></i>
            <p>请编写代码后点击"检查语法"按钮</p>
        </div>
    `;
}

// 事件监听器
checkBtn.addEventListener('click', checkSyntax);
resetBtn.addEventListener('click', resetCode);

// 初始化应用
initializePyodide();