import logging
from timeit import default_timer as timer

def config_logger(logger, level):
    logger.setLevel(level)
    logger.propagate = False

    # remove all default handlers
    for handler in logger.handlers:
        logger.removeHandler(handler)

    # create console handler and set level to debug
    console_handle = logging.StreamHandler()
    console_handle.setLevel(level)

    # create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)-10s - %(levelname)-8s - %(message)s')
    console_handle.setFormatter(formatter)

    # now add new handler to logger
    logger.addHandler(console_handle)


def log_elapsed(logger, msg, timedelta):
    end = timer()
    elapsed = timedelta.total_seconds()

    logger.debug(f"{msg}: elapsed {elapsed:.5f}")

