const TimerRemain = document.getElementById("timer");

async function loadSessionTime() {
  try {
    const res = await fetch("/session-time");

    if (!res.ok) {
      window.location.href = "index.html";
      return;
    }

    const data = await res.json();

  
    if (!data.remainingTime || data.remainingTime <= 0) {
      window.location.href = "index.html";
      return;
    }

    let remaining = data.remainingTime;

    if (!TimerRemain) return;

    const interval = setInterval(() => {

      if (remaining <= 0) {
        clearInterval(interval);
        window.location.href = "index.html";
        return;
      }

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      TimerRemain.innerText =
        `Session expires in: ${hours}h ${minutes}m ${seconds}s`;

      remaining -= 1000;

    }, 1000);

  } catch (err) {
    console.error("Timer error:", err);
    window.location.href = "index.html";
  }
}

loadSessionTime();