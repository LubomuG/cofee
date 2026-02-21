class CoffeeMachine {
    constructor(power) {
        this.waterAmount = 400;
        this.milkAmount = 350;
        this.coffeeAmount = 150;
        this.sugarAmount = 180;
        this.power = power;
        this.timerID = null;
        this.WATER_HEAT_CAPACITY = 4200;
    }

    getBoilTime(water, milk, coffee, sugar) {
        return (water * this.WATER_HEAT_CAPACITY * 80 / this.power) + 
               (milk * 20) + (coffee * 30) + (sugar * 10);
    }

    run(recipe, callback) {
        const time = this.getBoilTime(recipe.water, recipe.milk, recipe.coffee, recipe.sugar);
        this.timerID = setTimeout(callback, Math.max(2000, Math.min(5000, time)));
        return time;
    }

    stop() {
        clearTimeout(this.timerID);
    }
}

$(document).ready(function() {
    const machine = new CoffeeMachine(20000);
    
    const coffeeRecipes = {
        americano: { name: 'AMERICANO', water: 150, milk: 0, coffee: 20, sugar: 5, 
                    recipe: '150ml water · 20g coffee · 5g sugar' },
        cappuccino: { name: 'CAPPUCCINO', water: 30, milk: 120, coffee: 20, sugar: 10,
                     recipe: '30ml water · 120ml milk · 20g coffee · 10g sugar' },
        espresso: { name: 'ESPRESSO', water: 30, milk: 0, coffee: 20, sugar: 5,
                   recipe: '30ml water · 20g coffee · 5g sugar' },
        latte: { name: 'LATTE', water: 50, milk: 150, coffee: 20, sugar: 10,
                recipe: '50ml water · 150ml milk · 20g coffee · 10g sugar' },
        mocachino: { name: 'MOCACHINO', water: 30, milk: 100, coffee: 20, sugar: 15,
                    recipe: '30ml water · 100ml milk · 20g coffee · 15g sugar' }
    };
    
    let selectedCoffee = 'americano';
    let isBrewing = false;
    
    // Аудіо
    const fillSound = $('#fill-sound')[0];
    const brewSound = $('#brew-sound')[0];
    const doneSound = $('#done-sound')[0];
    const clickSound = $('#click-sound')[0];
    
    function playSound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
    
    // ---------- Local Storage ----------
    function saveToLocalStorage() {
        const state = {
            water: machine.waterAmount,
            milk: machine.milkAmount,
            coffee: machine.coffeeAmount,
            sugar: machine.sugarAmount
        };
        localStorage.setItem('coffeeMachineState', JSON.stringify(state));
    }

    function loadFromLocalStorage() {
        const saved = localStorage.getItem('coffeeMachineState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // Застосовуємо збережені значення, але не виходимо за максимальні межі
                machine.waterAmount = Math.min(state.water || 400, 500);
                machine.milkAmount = Math.min(state.milk || 350, 500);
                machine.coffeeAmount = Math.min(state.coffee || 150, 200);
                machine.sugarAmount = Math.min(state.sugar || 180, 200);
            } catch (e) {
                console.warn('Не вдалося завантажити стан з localStorage', e);
            }
        }
    }
    // -----------------------------------
    
    // Оновлення рівнів і текстів
    function updateLevels() {
        const waterPercent = (machine.waterAmount / 500) * 100;
        const milkPercent = (machine.milkAmount / 500) * 100;
        const coffeePercent = (machine.coffeeAmount / 200) * 100;
        const sugarPercent = (machine.sugarAmount / 200) * 100;
        
        $('#water-liquid').css('height', waterPercent + '%');
        $('#milk-liquid').css('height', milkPercent + '%');
        $('#coffee-liquid').css('height', coffeePercent + '%');
        $('#sugar-liquid').css('height', sugarPercent + '%');
        
        $('#water-level').text(machine.waterAmount + 'ml');
        $('#milk-level').text(machine.milkAmount + 'ml');
        $('#coffee-level').text(machine.coffeeAmount + 'g');
        $('#sugar-level').text(machine.sugarAmount + 'g');
        
        // Зберігаємо стан після будь-якої зміни рівнів
        saveToLocalStorage();
    }
    
    // Вибір кави
    $('.drink-btn').click(function() {
        if (isBrewing) return;
        
        playSound(clickSound);
        
        $('.drink-btn').removeClass('selected');
        $(this).addClass('selected');
        
        selectedCoffee = $(this).data('coffee');
        const recipe = coffeeRecipes[selectedCoffee];
        
        $('#selected-drink').text(recipe.name);
        $('#recipe-details').text(recipe.recipe);
        
        // Чашка стає пустою
        $('#cup-image').attr('src', './img/cofee_cup_empty.png').removeClass('full').addClass('empty');
        $('#cup-status').text('порожня');
        $('.progress-fill').css('width', '0%');
    });
    
    // Додавання інгредієнтів
    $('.add-btn').click(function() {
        if (isBrewing) return;
        
        const ingredient = $(this).data('ing');
        playSound(fillSound);
        
        switch(ingredient) {
            case 'water':
                machine.waterAmount = Math.min(machine.waterAmount + 100, 500);
                break;
            case 'milk':
                machine.milkAmount = Math.min(machine.milkAmount + 100, 500);
                break;
            case 'coffee':
                machine.coffeeAmount = Math.min(machine.coffeeAmount + 50, 200);
                break;
            case 'sugar':
                machine.sugarAmount = Math.min(machine.sugarAmount + 50, 200);
                break;
        }
        updateLevels();
    });
    
    // Приготування
    $('#brew-btn').click(function() {
        if (isBrewing) return;
        
        const recipe = coffeeRecipes[selectedCoffee];
        
        if (machine.waterAmount < recipe.water ||
            machine.milkAmount < recipe.milk ||
            machine.coffeeAmount < recipe.coffee ||
            machine.sugarAmount < recipe.sugar) {
            alert('❌ Недостатньо інгредієнтів!');
            return;
        }
        
        playSound(clickSound);
        isBrewing = true;
        
        // UI зміни
        $(this).prop('disabled', true).text('BREWING...');
        $('#led-indicator').addClass('brewing');
        $('#cup-status').text('вариться');
        $('.progress-fill').css('width', '0%');
        
        // Витрата
        machine.waterAmount -= recipe.water;
        machine.milkAmount -= recipe.milk;
        machine.coffeeAmount -= recipe.coffee;
        machine.sugarAmount -= recipe.sugar;
        updateLevels();  // тут автоматично збережеться новий стан
        
        playSound(brewSound);
        
        // Анімація прогрес-бару
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            $('.progress-fill').css('width', Math.min(progress, 100) + '%');
            if (progress >= 100) clearInterval(interval);
        }, 100);
        
        const brewTime = machine.run(recipe, function() {
            clearInterval(interval);
            $('.progress-fill').css('width', '100%');
            
            $('#cup-image').attr('src', './img/cofee_cup_full.png').removeClass('empty').addClass('full');
            $('#cup-status').text('готова');
            
            if (brewSound) brewSound.pause();
            playSound(doneSound);
            
            $('#brew-btn').prop('disabled', false).text('BREW');
            $('#led-indicator').removeClass('brewing');
            
            isBrewing = false;
            alert('✅ Ваша кава готова!');
        });
        
        console.log(`Час приготування: ${Math.round(brewTime)}ms`);
    });
    
    // Ініціалізація
    loadFromLocalStorage();        // відновлюємо збережені рівні
    updateLevels();                // відображаємо їх
    $('#cup-image').attr('src', './img/cofee_cup_empty.png');
    $('.drink-btn[data-coffee="americano"]').addClass('selected');
    $('#selected-drink').text(coffeeRecipes.americano.name);
    $('#recipe-details').text(coffeeRecipes.americano.recipe);
});
