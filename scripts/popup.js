const STORAGE_KEY = "last_inputs";

function changeLoading() {
    const loading = document.querySelector(".show");
    const content = document.querySelector(".hide");

    loading.classList.remove("show");
    loading.classList.add("hide");

    content.classList.remove("hide");
    content.classList.add("show");
}

function getList() {
    return document.querySelector(".list");
}

function getInputs(key, value) {
    const keyInputCell = document.createElement("td");
    const keyInput = document.createElement("input");
    keyInput.setAttribute("type", "text");
    keyInput.setAttribute("value", key ?? "");
    keyInput.classList.add("key");
    keyInputCell.appendChild(keyInput);

    const valueInputCell = document.createElement("td");
    const valueInput = document.createElement("input");
    valueInput.setAttribute("type", "text");
    valueInput.setAttribute("value", value ?? "");
    valueInput.classList.add("value");
    valueInputCell.appendChild(valueInput);

    const deleteButtonCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete");
    deleteButton.innerText = "-";
    deleteButton.addEventListener("click", () => {
        wrapper.remove();
    });
    deleteButtonCell.appendChild(deleteButton);

    const wrapper = document.createElement("tr");

    wrapper.appendChild(keyInputCell);
    wrapper.appendChild(valueInputCell);
    wrapper.appendChild(deleteButtonCell);

    return wrapper;
}

function appendInputsToList(key, value) {
    const list = getList();
    list.appendChild(getInputs(key, value));
}

async function submit() {
    async function writeInputs() {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [inputs],
            func: async (variables) => {
                const sleep = () => {
                    return new Promise((resolve) => {
                        setTimeout(resolve, 100)
                    })
                }

                for (const [key, value] of variables) {
                    const keyInputs = document.querySelectorAll('[placeholder="Input variable key"]');
                    const lastKeyInput = keyInputs[keyInputs.length - 1];
                    const valueInputs = document.querySelectorAll('[placeholder="Input variable value"]');
                    const lastValueInput = valueInputs[valueInputs.length - 1];

                    lastKeyInput.value = key;
                    lastValueInput.value = value;

                    const eventMakingNewInput = new Event("change");
                    lastKeyInput.dispatchEvent(eventMakingNewInput);
                    lastValueInput.dispatchEvent(eventMakingNewInput);

                    await sleep();
                }
            },
        });
    }

    async function store() {
        await chrome.storage.local.set({ [STORAGE_KEY]: inputs });
        console.log("Inputs are saved", inputs);
    }

    const inputs = [];
    (function extractInputs() {
        const lists = getList().getElementsByTagName("tr");
        for (let i = 0; i < lists.length; i++) {
            const key = lists[i].getElementsByClassName("key")[0].value;
            const value = lists[i].getElementsByClassName("value")[0].value;

            if (key === "" || value === "") {
                continue;
            }

            inputs.push([key, value]);
        }
    })();

    await writeInputs();
    await store();
}

window.onload = async () => {
    const result = await chrome.storage.local.get();

    changeLoading();

    const inputs = result[STORAGE_KEY] ?? [["", ""]];

    const addButton = document.querySelector(".add");
    addButton.addEventListener("click", () => {
        appendInputsToList();
    });

    const submitButton = document.querySelector(".submit");
    submitButton.addEventListener("click", submit);

    const table = document.querySelector("table");
    table.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            submit();
        }
    });

    for (const [key, value] of inputs) {
        appendInputsToList(key, value);
    }
};
