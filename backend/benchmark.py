import gc
import time
import tracemalloc
from collections.abc import Callable
from threading import Lock
from typing import TypeVar


Result = TypeVar("Result")
_benchmark_lock = Lock()


def benchmark_algorithm(
    algorithm: Callable[[str, str], Result],
    start: str,
    goal: str,
) -> tuple[Result, dict[str, float]]:
    """Return an algorithm's result, execution time, and peak Python memory."""
    with _benchmark_lock:
        # Time an ordinary run without memory-profiler overhead.
        gc.collect()
        started_at = time.perf_counter_ns()
        result = algorithm(start, goal)
        elapsed_ns = time.perf_counter_ns() - started_at

        # Use a separate identical run to measure peak allocated memory.
        gc.collect()
        tracemalloc.start()
        try:
            memory_run_result = algorithm(start, goal)
            _, peak_memory_bytes = tracemalloc.get_traced_memory()
            del memory_run_result
        finally:
            tracemalloc.stop()

    metrics = {
        "execution_time_ms": round(elapsed_ns / 1_000_000, 3),
        "peak_memory_kb": round(peak_memory_bytes / 1024, 2),
    }

    return result, metrics
