class ThanksScheduler {
  constructor() {
    this.selectedDate = null;
    this.selectedSlot = null;
    this.availableDates = [];
    this.slotSets = [
      [
        { start: "09:00", end: "09:30" },
        { start: "10:00", end: "10:30" },
        { start: "11:30", end: "12:00" },
        { start: "14:00", end: "14:30" },
      ],
      [
        { start: "08:30", end: "09:00" },
        { start: "10:30", end: "11:00" },
        { start: "13:30", end: "14:00" },
        { start: "16:00", end: "16:30" },
      ],
      [
        { start: "09:15", end: "09:45" },
        { start: "11:00", end: "11:30" },
        { start: "15:00", end: "15:30" },
        { start: "17:00", end: "17:30" },
      ],
    ];

    this.title = document.getElementById("thanksTitle");
    this.intro = document.getElementById("thanksIntro");
    this.datesRow = document.getElementById("datesRow");
    this.timesContainer = document.getElementById("timesContainer");
    this.timesGrid = document.getElementById("timesGrid");
    this.selectBtn = document.getElementById("selectTimeBtn");
    this.step1 = document.getElementById("stepDateTime");
    this.step2 = document.getElementById("stepConfirmation");
    this.confirmationMsg = document.getElementById("confirmationMessage");
    this.changeBtn = document.getElementById("changeTimeBtn");
    this.waitBtn = document.getElementById("waitForCallBtn");
    this.completionNote = document.getElementById("completionNote");

    this.init();
  }

  init() {
    this.personalizeHeader();
    this.generateDates();
    this.renderDates();
    this.attachEvents();
  }

  personalizeHeader() {
    try {
      const savedProfile = JSON.parse(
        sessionStorage.getItem("registrationProfile") || "null",
      );

      if (savedProfile?.firstName) {
        this.title.textContent = `Thanks, ${savedProfile.firstName}!`;
        this.intro.textContent =
          "Your registration is complete. Choose a convenient time for a short call.";
      }
    } catch {
      // Session storage can be unavailable or cleared between pages.
    }
  }

  generateDates() {
    const cursor = new Date();

    while (this.availableDates.length < 3) {
      const day = cursor.getDay();

      if (day !== 0 && day !== 6) {
        this.availableDates.push(new Date(cursor));
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  renderDates() {
    this.datesRow.innerHTML = this.availableDates
      .map((date, index) => {
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const monthName = date.toLocaleDateString("en-US", { month: "short" });

        return `
          <button type="button" class="date-card" data-index="${index}">
            <span class="day-name">${dayName}</span>
            <span class="date-number-container">
              <span class="day-number">${date.getDate()}</span>
              <span class="month-name">${monthName}</span>
            </span>
          </button>
        `;
      })
      .join("");
  }

  getSlotsForDate(index) {
    return this.slotSets[index % this.slotSets.length];
  }

  renderSlots(index) {
    const slots = this.getSlotsForDate(index);

    this.timesGrid.innerHTML = slots
      .map(
        (slot) => `
          <button
            type="button"
            class="time-card"
            data-start="${slot.start}"
            data-end="${slot.end}"
          >
            <span class="time-display">
              <span class="time-value">${slot.start}</span>
              <span class="time-separator">-</span>
              <span class="time-value">${slot.end}</span>
            </span>
          </button>
        `,
      )
      .join("");
  }

  attachEvents() {
    this.datesRow.addEventListener("click", (event) => {
      const card = event.target.closest(".date-card");

      if (!card) return;

      const index = Number(card.dataset.index);

      document.querySelectorAll(".date-card").forEach((item) => {
        item.classList.remove("selected");
      });

      card.classList.add("selected");
      this.selectedDate = this.availableDates[index];
      this.selectedSlot = null;
      this.selectBtn.disabled = true;
      this.completionNote.hidden = true;
      this.waitBtn.disabled = false;
      this.waitBtn.textContent = "Confirm slot";

      this.timesContainer.hidden = false;
      this.renderSlots(index);
      this.attachSlotEvents();
    });

    this.selectBtn.addEventListener("click", () => {
      if (this.selectedDate && this.selectedSlot) {
        this.showConfirmation();
      }
    });

    this.changeBtn.addEventListener("click", () => {
      this.step1.hidden = false;
      this.step2.hidden = true;
      this.completionNote.hidden = true;
      this.waitBtn.disabled = false;
      this.waitBtn.textContent = "Confirm slot";
    });

    this.waitBtn.addEventListener("click", () => {
      if (!this.selectedDate || !this.selectedSlot) return;

      this.completionNote.hidden = false;
      this.completionNote.textContent =
        `You're all set. Your preferred time is ${this.formatSelection()}.`;
      this.waitBtn.disabled = true;
      this.waitBtn.textContent = "Scheduled";
    });
  }

  attachSlotEvents() {
    document.querySelectorAll(".time-card").forEach((card) => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".time-card").forEach((item) => {
          item.classList.remove("selected");
        });

        card.classList.add("selected");
        this.selectedSlot = {
          start: card.dataset.start,
          end: card.dataset.end,
        };

        this.selectBtn.disabled = false;
      });
    });
  }

  formatSelection() {
    const date = this.selectedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

    return `${date}, ${this.selectedSlot.start}-${this.selectedSlot.end}`;
  }

  showConfirmation() {
    this.confirmationMsg.textContent =
      `Preferred time: ${this.formatSelection()}.`;

    this.step1.hidden = true;
    this.step2.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", () => new ThanksScheduler());
