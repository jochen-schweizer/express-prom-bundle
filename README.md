# express prometheus bundle

A bundle of standard metrics for an express application.

Included metrics:
    
* **up**: normally is just 1
* **nodejs_memory_heap_total_bytes** and **nodejs_memory_heap_used_bytes**
* **http_request_total**: count of http requests labeled with status_code